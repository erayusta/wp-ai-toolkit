#!/usr/bin/env node

/**
 * WordPress Storefront MCP Server
 *
 * A second MCP server focused on WooCommerce storefront operations:
 * - Product search and browsing
 * - Cart management
 * - Order tracking
 * - Store information and policies
 *
 * Connects to a live WooCommerce site via REST API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { logger } from "./utils/logger.js";
import { fetchJson } from "./utils/http.js";
import { successResponse, errorResponse } from "./types.js";

const server = new McpServer({
  name: "wp-storefront",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Helper: WooCommerce API request
// ---------------------------------------------------------------------------

interface WcApiOptions {
  siteUrl: string;
  consumerKey?: string;
  consumerSecret?: string;
}

async function wcApi<T>(path: string, opts: WcApiOptions): Promise<T> {
  const base = opts.siteUrl.replace(/\/$/, "");
  let url = `${base}/wp-json/wc/v3${path}`;

  if (opts.consumerKey && opts.consumerSecret) {
    const sep = url.includes("?") ? "&" : "?";
    url += `${sep}consumer_key=${opts.consumerKey}&consumer_secret=${opts.consumerSecret}`;
  }

  return fetchJson<T>(url, { timeout: 20_000 });
}

// ---------------------------------------------------------------------------
// Tool: search_products
// ---------------------------------------------------------------------------

server.tool(
  "search_products",
  `Search WooCommerce products on a live store.
Returns product name, price, stock status, categories, and images.
Supports filtering by category, price range, and stock status.`,
  {
    siteUrl: z.string().url().describe("WooCommerce store URL (e.g., https://example.com)"),
    query: z.string().optional().describe("Search query for product name or description."),
    category: z.string().optional().describe("Filter by category slug."),
    minPrice: z.number().optional().describe("Minimum price filter."),
    maxPrice: z.number().optional().describe("Maximum price filter."),
    inStock: z.boolean().optional().default(true).describe("Only show in-stock products."),
    perPage: z.number().optional().default(10).describe("Number of results (1-50)."),
    consumerKey: z.string().optional().describe("WooCommerce REST API consumer key."),
    consumerSecret: z.string().optional().describe("WooCommerce REST API consumer secret."),
  },
  async (params) => {
    try {
      const { siteUrl, query, category, minPrice, maxPrice, inStock, perPage, consumerKey, consumerSecret } = params;

      let path = `/products?per_page=${Math.min(perPage ?? 10, 50)}&status=publish`;
      if (query) path += `&search=${encodeURIComponent(query)}`;
      if (category) path += `&category=${encodeURIComponent(category)}`;
      if (minPrice !== undefined) path += `&min_price=${minPrice}`;
      if (maxPrice !== undefined) path += `&max_price=${maxPrice}`;
      if (inStock) path += `&stock_status=instock`;

      const products = await wcApi<Array<{
        id: number; name: string; slug: string; permalink: string;
        price: string; regular_price: string; sale_price: string;
        stock_status: string; stock_quantity: number | null;
        short_description: string; categories: Array<{ name: string }>;
        images: Array<{ src: string; alt: string }>;
        average_rating: string; rating_count: number;
      }>>(path, { siteUrl, consumerKey, consumerSecret });

      if (products.length === 0) {
        return successResponse(`No products found${query ? ` for "${query}"` : ""}. Try a different search term.`);
      }

      const formatted = products.map((p, i) => {
        const price = p.sale_price
          ? `~~${p.regular_price}~~ **${p.sale_price}** (sale)`
          : p.price;
        const stock = p.stock_status === "instock"
          ? `In Stock${p.stock_quantity !== null ? ` (${p.stock_quantity})` : ""}`
          : "Out of Stock";
        const cats = p.categories.map((c) => c.name).join(", ");
        const rating = p.rating_count > 0 ? `${p.average_rating}/5 (${p.rating_count} reviews)` : "No reviews";
        const image = p.images[0]?.src ?? "No image";

        return `### ${i + 1}. ${p.name}
**Price**: ${price}
**Stock**: ${stock}
**Categories**: ${cats || "None"}
**Rating**: ${rating}
**URL**: ${p.permalink}
**Image**: ${image}`;
      }).join("\n\n---\n\n");

      return successResponse(`# Product Search Results

**Store**: ${siteUrl}
${query ? `**Query**: "${query}"\n` : ""}**Results**: ${products.length}

---

${formatted}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("search_products failed", { error: msg });
      return errorResponse(`Failed to search products: ${msg}`);
    }
  }
);

// ---------------------------------------------------------------------------
// Tool: get_product_details
// ---------------------------------------------------------------------------

server.tool(
  "get_product_details",
  `Get detailed information about a specific WooCommerce product by ID or slug.
Returns full product data including attributes, variations, and related products.`,
  {
    siteUrl: z.string().url().describe("WooCommerce store URL"),
    productId: z.number().optional().describe("Product ID"),
    slug: z.string().optional().describe("Product slug (alternative to ID)"),
    consumerKey: z.string().optional().describe("WooCommerce REST API consumer key."),
    consumerSecret: z.string().optional().describe("WooCommerce REST API consumer secret."),
  },
  async (params) => {
    try {
      const { siteUrl, productId, slug, consumerKey, consumerSecret } = params;

      let path: string;
      if (productId) {
        path = `/products/${productId}`;
      } else if (slug) {
        path = `/products?slug=${encodeURIComponent(slug)}`;
      } else {
        return errorResponse("Either productId or slug is required.");
      }

      const result = await wcApi<unknown>(path, { siteUrl, consumerKey, consumerSecret });
      const product = Array.isArray(result) ? result[0] : result;

      if (!product) {
        return errorResponse("Product not found.");
      }

      const p = product as Record<string, unknown>;
      return successResponse(`# Product: ${p.name}

**ID**: ${p.id}
**Type**: ${p.type}
**Status**: ${p.status}
**Price**: ${p.price}${p.sale_price ? ` (sale: ${p.sale_price})` : ""}
**Regular Price**: ${p.regular_price}
**SKU**: ${p.sku || "N/A"}
**Stock**: ${p.stock_status}${p.stock_quantity !== null ? ` (${p.stock_quantity} units)` : ""}
**Weight**: ${p.weight || "N/A"}
**Dimensions**: ${(p.dimensions as Record<string, string>)?.length || "?"} × ${(p.dimensions as Record<string, string>)?.width || "?"} × ${(p.dimensions as Record<string, string>)?.height || "?"}
**URL**: ${p.permalink}

## Description
${p.short_description || p.description || "No description"}

## Categories
${(p.categories as Array<{ name: string }>)?.map((c) => `- ${c.name}`).join("\n") || "None"}

## Tags
${(p.tags as Array<{ name: string }>)?.map((t) => `- ${t.name}`).join("\n") || "None"}

## Attributes
${(p.attributes as Array<{ name: string; options: string[] }>)?.map((a) => `- **${a.name}**: ${a.options.join(", ")}`).join("\n") || "None"}

## Images
${(p.images as Array<{ src: string }>)?.map((img, i) => `${i + 1}. ${img.src}`).join("\n") || "No images"}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("get_product_details failed", { error: msg });
      return errorResponse(`Failed to get product details: ${msg}`);
    }
  }
);

// ---------------------------------------------------------------------------
// Tool: get_orders
// ---------------------------------------------------------------------------

server.tool(
  "get_orders",
  `List WooCommerce orders with filtering options.
Requires authentication (consumer key/secret).`,
  {
    siteUrl: z.string().url().describe("WooCommerce store URL"),
    consumerKey: z.string().describe("WooCommerce REST API consumer key."),
    consumerSecret: z.string().describe("WooCommerce REST API consumer secret."),
    status: z.enum(["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed", "any"]).optional().default("any").describe("Order status filter."),
    perPage: z.number().optional().default(10).describe("Number of results."),
    customerId: z.number().optional().describe("Filter by customer ID."),
  },
  async (params) => {
    try {
      const { siteUrl, consumerKey, consumerSecret, status, perPage, customerId } = params;

      let path = `/orders?per_page=${Math.min(perPage ?? 10, 50)}`;
      if (status && status !== "any") path += `&status=${status}`;
      if (customerId) path += `&customer=${customerId}`;

      const orders = await wcApi<Array<{
        id: number; status: string; total: string; currency: string;
        date_created: string; billing: { first_name: string; last_name: string; email: string };
        line_items: Array<{ name: string; quantity: number; total: string }>;
        payment_method_title: string;
      }>>(path, { siteUrl, consumerKey, consumerSecret });

      if (orders.length === 0) {
        return successResponse("No orders found matching the criteria.");
      }

      const formatted = orders.map((o) => {
        const items = o.line_items.map((li) => `  - ${li.name} × ${li.quantity} = ${li.total}`).join("\n");
        return `### Order #${o.id}
**Status**: ${o.status}
**Total**: ${o.currency} ${o.total}
**Date**: ${o.date_created}
**Customer**: ${o.billing.first_name} ${o.billing.last_name} (${o.billing.email})
**Payment**: ${o.payment_method_title}
**Items**:
${items}`;
      }).join("\n\n---\n\n");

      return successResponse(`# Orders

**Store**: ${siteUrl}
**Filter**: ${status === "any" ? "All" : status}
**Results**: ${orders.length}

---

${formatted}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("get_orders failed", { error: msg });
      return errorResponse(`Failed to fetch orders: ${msg}`);
    }
  }
);

// ---------------------------------------------------------------------------
// Tool: get_store_info
// ---------------------------------------------------------------------------

server.tool(
  "get_store_info",
  `Get WooCommerce store information: settings, currency, shipping zones, payment gateways, and tax configuration.
Requires authentication.`,
  {
    siteUrl: z.string().url().describe("WooCommerce store URL"),
    consumerKey: z.string().describe("WooCommerce REST API consumer key."),
    consumerSecret: z.string().describe("WooCommerce REST API consumer secret."),
  },
  async (params) => {
    try {
      const { siteUrl, consumerKey, consumerSecret } = params;
      const opts = { siteUrl, consumerKey, consumerSecret };

      // Fetch multiple endpoints in parallel
      const [settings, gateways, zones] = await Promise.allSettled([
        wcApi<Array<{ id: string; value: string }>>("/settings/general", opts),
        wcApi<Array<{ id: string; title: string; enabled: boolean }>>("/payment_gateways", opts),
        wcApi<Array<{ id: number; name: string }>>("/shipping/zones", opts),
      ]);

      let response = `# Store Information\n\n**URL**: ${siteUrl}\n\n`;

      // Settings
      if (settings.status === "fulfilled") {
        const s = settings.value;
        const get = (id: string) => s.find((x) => x.id === id)?.value ?? "N/A";
        response += `## General Settings
- **Store Address**: ${get("woocommerce_store_address")}, ${get("woocommerce_store_city")}, ${get("woocommerce_store_postcode")}
- **Country**: ${get("woocommerce_default_country")}
- **Currency**: ${get("woocommerce_currency")}
- **Selling Locations**: ${get("woocommerce_allowed_countries")}
\n`;
      }

      // Payment Gateways
      if (gateways.status === "fulfilled") {
        const active = gateways.value.filter((g) => g.enabled);
        response += `## Payment Gateways (${active.length} active)
${gateways.value.map((g) => `- ${g.enabled ? "✅" : "❌"} **${g.title}** (${g.id})`).join("\n")}
\n`;
      }

      // Shipping Zones
      if (zones.status === "fulfilled") {
        response += `## Shipping Zones (${zones.value.length})
${zones.value.map((z) => `- **${z.name}** (ID: ${z.id})`).join("\n")}
\n`;
      }

      return successResponse(response);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("get_store_info failed", { error: msg });
      return errorResponse(`Failed to get store info: ${msg}`);
    }
  }
);

// ---------------------------------------------------------------------------
// Tool: get_store_stats
// ---------------------------------------------------------------------------

server.tool(
  "get_store_stats",
  `Get WooCommerce store statistics: sales totals, top products, order counts.
Requires authentication.`,
  {
    siteUrl: z.string().url().describe("WooCommerce store URL"),
    consumerKey: z.string().describe("WooCommerce REST API consumer key."),
    consumerSecret: z.string().describe("WooCommerce REST API consumer secret."),
    period: z.enum(["week", "month", "last_month", "year"]).optional().default("month").describe("Report period."),
  },
  async (params) => {
    try {
      const { siteUrl, consumerKey, consumerSecret, period } = params;
      const opts = { siteUrl, consumerKey, consumerSecret };

      const [sales, topSellers] = await Promise.allSettled([
        wcApi<Array<{ total_sales: string; net_sales: string; total_orders: number; total_items: number; total_customers: number }>>(`/reports/sales?period=${period}`, opts),
        wcApi<Array<{ name: string; product_id: number; quantity: number }>>("/reports/top_sellers?period=month", opts),
      ]);

      let response = `# Store Statistics\n\n**Store**: ${siteUrl}\n**Period**: ${period}\n\n`;

      if (sales.status === "fulfilled" && sales.value.length > 0) {
        const s = sales.value[0];
        response += `## Sales Summary
- **Total Sales**: ${s.total_sales}
- **Net Sales**: ${s.net_sales}
- **Orders**: ${s.total_orders}
- **Items Sold**: ${s.total_items}
- **Customers**: ${s.total_customers}
\n`;
      }

      if (topSellers.status === "fulfilled" && topSellers.value.length > 0) {
        response += `## Top Sellers (This Month)
${topSellers.value.slice(0, 10).map((p, i) => `${i + 1}. **${p.name}** — ${p.quantity} sold`).join("\n")}
\n`;
      }

      return successResponse(response);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("get_store_stats failed", { error: msg });
      return errorResponse(`Failed to get store stats: ${msg}`);
    }
  }
);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  logger.info("Starting WordPress Storefront MCP Server v1.0.0");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Storefront MCP Server connected and ready");
}

main().catch((error) => {
  logger.error("Fatal error starting Storefront MCP server", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

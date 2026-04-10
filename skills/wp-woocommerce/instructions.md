# WordPress WooCommerce — Agent Skill

You are an expert in WooCommerce development. Follow these guidelines when helping users.

## Product Types

| Type | Description |
|------|-------------|
| **Simple** | Single product with one price, no variations |
| **Variable** | Product with variations (size, color) — each variation has its own SKU, price, stock |
| **Grouped** | Collection of related simple products displayed together |
| **External/Affiliate** | Product listed on your site, purchased elsewhere via external URL |
| **Virtual** | Non-physical product (no shipping) |
| **Downloadable** | Virtual product with downloadable files |

## Key Action Hooks

| Hook | When it fires |
|------|--------------|
| `woocommerce_before_cart` | Before cart table |
| `woocommerce_after_cart` | After cart table |
| `woocommerce_before_checkout_form` | Before checkout form |
| `woocommerce_checkout_process` | During checkout validation |
| `woocommerce_checkout_order_processed` | After order is created but before payment |
| `woocommerce_payment_complete` | After successful payment |
| `woocommerce_order_status_changed` | When order status changes (params: $order_id, $old_status, $new_status) |
| `woocommerce_new_order` | When a new order is created |
| `woocommerce_created_customer` | After a new customer account is created |
| `woocommerce_before_single_product` | Before single product page |
| `woocommerce_after_shop_loop_item` | After each product in the loop |
| `woocommerce_before_add_to_cart_button` | Before add-to-cart button |

## Key Filter Hooks

| Hook | What it filters |
|------|----------------|
| `woocommerce_product_get_price` | Product price |
| `woocommerce_cart_item_price` | Price displayed in cart |
| `woocommerce_checkout_fields` | Checkout form fields |
| `woocommerce_payment_gateways` | Available payment gateways |
| `woocommerce_shipping_methods` | Available shipping methods |
| `woocommerce_get_availability` | Product availability text |
| `woocommerce_add_to_cart_validation` | Validate before adding to cart |
| `woocommerce_product_tabs` | Product page tabs |
| `woocommerce_email_classes` | WooCommerce email classes |
| `woocommerce_currencies` | Available currencies |

## Payment Gateway

```php
<?php
class WC_Gateway_Custom extends WC_Payment_Gateway {

    public function __construct() {
        $this->id                 = 'custom_gateway';
        $this->icon               = '';
        $this->has_fields         = false;
        $this->method_title       = __('Custom Gateway', 'my-plugin');
        $this->method_description = __('Custom payment gateway.', 'my-plugin');

        $this->supports = ['products', 'refunds'];

        $this->init_form_fields();
        $this->init_settings();

        $this->title   = $this->get_option('title');
        $this->enabled = $this->get_option('enabled');

        add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
    }

    public function init_form_fields() {
        $this->form_fields = [
            'enabled' => [
                'title'   => __('Enable/Disable', 'my-plugin'),
                'type'    => 'checkbox',
                'label'   => __('Enable Custom Gateway', 'my-plugin'),
                'default' => 'no',
            ],
            'title' => [
                'title'       => __('Title', 'my-plugin'),
                'type'        => 'text',
                'default'     => __('Custom Payment', 'my-plugin'),
                'description' => __('Title shown at checkout.', 'my-plugin'),
            ],
        ];
    }

    public function process_payment($order_id) {
        $order = wc_get_order($order_id);

        // Process payment via external API...

        $order->payment_complete();
        WC()->cart->empty_cart();

        return [
            'result'   => 'success',
            'redirect' => $this->get_return_url($order),
        ];
    }
}

// Register the gateway
add_filter('woocommerce_payment_gateways', function ($gateways) {
    $gateways[] = 'WC_Gateway_Custom';
    return $gateways;
});
```

## WooCommerce REST API

Endpoints under the `wc/v3` namespace. Authentication via consumer key/secret.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/wc/v3/products` | GET, POST | List/create products |
| `/wc/v3/products/{id}` | GET, PUT, DELETE | Single product CRUD |
| `/wc/v3/products/{id}/variations` | GET, POST | Product variations |
| `/wc/v3/orders` | GET, POST | List/create orders |
| `/wc/v3/orders/{id}` | GET, PUT, DELETE | Single order CRUD |
| `/wc/v3/customers` | GET, POST | List/create customers |
| `/wc/v3/coupons` | GET, POST | List/create coupons |
| `/wc/v3/reports/sales` | GET | Sales reports |
| `/wc/v3/shipping/zones` | GET, POST | Shipping zones |
| `/wc/v3/taxes` | GET, POST | Tax rates |

```bash
# Authentication with consumer key/secret
curl https://example.com/wp-json/wc/v3/products \
  -u ck_xxxx:cs_xxxx
```

```php
// Register custom WC REST endpoint
add_action('rest_api_init', function () {
    register_rest_route('my-plugin/v1', '/custom-orders', [
        'methods'             => 'GET',
        'callback'            => 'myplugin_get_custom_orders',
        'permission_callback' => function () {
            return current_user_can('manage_woocommerce');
        },
    ]);
});
```

## Custom Product Fields

```php
// Add field to product editor
add_action('woocommerce_product_options_general_product_data', function () {
    woocommerce_wp_text_input([
        'id'          => '_custom_field',
        'label'       => __('Custom Field', 'my-plugin'),
        'desc_tip'    => true,
        'description' => __('Enter a custom value.', 'my-plugin'),
    ]);
});

// Save field value
add_action('woocommerce_process_product_meta', function ($post_id) {
    $value = sanitize_text_field($_POST['_custom_field'] ?? '');
    update_post_meta($post_id, '_custom_field', $value);
});

// Display on frontend
add_action('woocommerce_single_product_summary', function () {
    global $product;
    $value = $product->get_meta('_custom_field');
    if ($value) {
        printf('<p class="custom-field">%s</p>', esc_html($value));
    }
}, 25);
```

## HPOS Compatibility

High-Performance Order Storage (HPOS) replaces the post meta-based storage with custom tables. All new plugins must declare compatibility.

```php
// Declare HPOS compatibility in your main plugin file
add_action('before_woocommerce_init', function () {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            __FILE__,
            true
        );
    }
});

// Use CRUD methods — NOT direct post meta access
// BAD:  get_post_meta($order_id, '_billing_email', true);
// GOOD: $order->get_billing_email();

// BAD:  update_post_meta($order_id, '_custom_field', $value);
// GOOD: $order->update_meta_data('_custom_field', $value); $order->save();

// Check if HPOS is enabled
use Automattic\WooCommerce\Utilities\OrderUtil;
if (OrderUtil::custom_orders_table_usage_is_enabled()) {
    // HPOS is active
}
```

## WooCommerce Blocks

Extend the block-based checkout and cart:

```php
// Register block integration
add_action('woocommerce_blocks_loaded', function () {
    require_once __DIR__ . '/includes/class-my-block-integration.php';

    add_action('woocommerce_blocks_checkout_block_registration', function ($registry) {
        $registry->register(new My_Block_Integration());
    });
});

// IntegrationInterface implementation
use Automattic\WooCommerce\Blocks\Integrations\IntegrationInterface;

class My_Block_Integration implements IntegrationInterface {
    public function get_name() { return 'my-plugin-blocks'; }
    public function initialize() {
        // Register scripts for the block editor and frontend
    }
    public function get_editor_script_handles() { return ['my-plugin-block-editor']; }
    public function get_script_handles() { return ['my-plugin-block-frontend']; }
    public function get_script_data() {
        return ['setting' => get_option('my_setting', '')];
    }
}
```

## Best Practices

1. **Check if WooCommerce is active** — wrap your code: `if (class_exists('WooCommerce')) { ... }`
2. **Declare HPOS compatibility** — required for all new plugins
3. **Use WC CRUD methods** — `$order->get_*()`, `$order->set_*()`, `$order->save()` — never direct `post_meta`
4. **Hook at correct priority** — default is 10; use higher numbers to run later
5. **Use `wc_get_order()`** — not `get_post()` for order objects
6. **Sanitize and validate** — all custom checkout fields and product meta
7. **Test with latest WC** — use WC beta tester plugin for compatibility testing
8. **Handle currency properly** — use `wc_price()` for display, raw numbers for calculations
9. **Respect WC templates** — override via `yourtheme/woocommerce/` directory, not by editing WC files
10. **Use WC logging** — `wc_get_logger()->info('message', ['source' => 'my-plugin'])` instead of `error_log`

/**
 * Tool: validate_block_json
 *
 * Validates block.json and theme.json files against WordPress schemas.
 * Checks for required fields, valid values, and common mistakes.
 */

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  successResponse,
  errorResponse,
  type ToolResponse,
  type ValidationError,
  type ValidationWarning,
  type BlockJsonValidationResult,
} from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

export const validateBlockJsonSchema = z.object({
  json: z.string().describe("The JSON content of block.json or theme.json to validate."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  type: z
    .enum(["block", "theme"])
    .optional()
    .default("block")
    .describe("Type of JSON file: 'block' for block.json, 'theme' for theme.json."),
  artifactId: z.string().optional().describe("Artifact ID for tracking revisions."),
  revision: z.number().optional().default(1).describe("Revision number."),
});

export type ValidateBlockJsonInput = z.infer<typeof validateBlockJsonSchema>;

const BLOCK_JSON_REQUIRED_FIELDS = ["$schema", "apiVersion", "name", "version", "title", "category"];
const BLOCK_JSON_OPTIONAL_FIELDS = [
  "description", "keywords", "textdomain", "attributes", "providesContext",
  "usesContext", "selectors", "supports", "styles", "example", "variations",
  "editorScript", "script", "viewScript", "editorStyle", "style", "viewStyle",
  "render", "parent", "ancestor", "allowedBlocks", "icon",
];
const VALID_CATEGORIES = [
  "text", "media", "design", "widgets", "theme", "embed",
];
const VALID_API_VERSIONS = [1, 2, 3];

const THEME_JSON_REQUIRED_FIELDS = ["$schema", "version"];
const THEME_JSON_VALID_VERSIONS = [1, 2, 3];
const THEME_JSON_TOP_LEVEL_KEYS = [
  "$schema", "version", "title", "description", "settings", "styles",
  "customTemplates", "templateParts", "patterns", "slug",
];

function validateBlockJson(parsed: Record<string, unknown>): { errors: ValidationError[]; warnings: ValidationWarning[]; detectedFields: string[]; missingRequired: string[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const detectedFields = Object.keys(parsed);
  const missingRequired: string[] = [];

  // Check required fields
  for (const field of BLOCK_JSON_REQUIRED_FIELDS) {
    if (!(field in parsed)) {
      if (field === "$schema") {
        warnings.push({
          message: `Missing '$schema' field. Recommended: "https://schemas.wp.org/trunk/block.json"`,
          severity: "warning",
          rule: "missing-schema",
          suggestion: `Add: "$schema": "https://schemas.wp.org/trunk/block.json"`,
        });
      } else {
        missingRequired.push(field);
        errors.push({
          message: `Missing required field: '${field}'`,
          severity: "error",
          rule: "missing-required-field",
        });
      }
    }
  }

  // Validate apiVersion
  if ("apiVersion" in parsed && !VALID_API_VERSIONS.includes(parsed.apiVersion as number)) {
    errors.push({
      message: `Invalid apiVersion: ${parsed.apiVersion}. Must be one of: ${VALID_API_VERSIONS.join(", ")}`,
      severity: "error",
      rule: "invalid-api-version",
    });
  }

  // Validate block name format (namespace/block-name)
  if ("name" in parsed) {
    const name = parsed.name as string;
    if (!/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test(name)) {
      errors.push({
        message: `Invalid block name format: '${name}'. Must be 'namespace/block-name' (lowercase, hyphens only).`,
        severity: "error",
        rule: "invalid-block-name",
        suggestion: "Example: 'my-plugin/my-block'",
      });
    }
    if (name.startsWith("core/")) {
      warnings.push({
        message: "Block name uses 'core/' namespace which is reserved for WordPress core blocks.",
        severity: "warning",
        rule: "reserved-namespace",
      });
    }
  }

  // Validate category
  if ("category" in parsed && !VALID_CATEGORIES.includes(parsed.category as string)) {
    warnings.push({
      message: `Unknown category: '${parsed.category}'. Standard categories: ${VALID_CATEGORIES.join(", ")}`,
      severity: "warning",
      rule: "unknown-category",
      suggestion: "Custom categories work if registered via block_categories_all filter.",
    });
  }

  // Validate attributes structure
  if ("attributes" in parsed && typeof parsed.attributes === "object" && parsed.attributes !== null) {
    const attrs = parsed.attributes as Record<string, unknown>;
    for (const [attrName, attrDef] of Object.entries(attrs)) {
      if (typeof attrDef !== "object" || attrDef === null) {
        errors.push({
          message: `Attribute '${attrName}' must be an object with a 'type' property.`,
          severity: "error",
          rule: "invalid-attribute",
        });
        continue;
      }
      const def = attrDef as Record<string, unknown>;
      if (!("type" in def) && !("source" in def) && !("enum" in def)) {
        errors.push({
          message: `Attribute '${attrName}' must have a 'type' property (string, number, boolean, object, array, null, integer).`,
          severity: "error",
          rule: "missing-attribute-type",
        });
      }
    }
  }

  // Validate supports
  if ("supports" in parsed && typeof parsed.supports === "object" && parsed.supports !== null) {
    const supports = parsed.supports as Record<string, unknown>;
    const knownSupports = [
      "align", "alignWide", "anchor", "background", "className", "color",
      "customClassName", "dimensions", "filter", "html", "inserter",
      "interactivity", "layout", "lock", "metadata", "multiple",
      "position", "reusable", "renaming", "shadow", "spacing",
      "splitting", "typography",
    ];
    for (const key of Object.keys(supports)) {
      if (!knownSupports.includes(key) && !key.startsWith("__")) {
        warnings.push({
          message: `Unknown supports feature: '${key}'. This may be a custom or experimental feature.`,
          severity: "warning",
          rule: "unknown-supports",
        });
      }
    }
  }

  // Check for unknown top-level fields
  const allKnownFields = [...BLOCK_JSON_REQUIRED_FIELDS, ...BLOCK_JSON_OPTIONAL_FIELDS];
  for (const field of detectedFields) {
    if (!allKnownFields.includes(field) && !field.startsWith("__")) {
      warnings.push({
        message: `Unknown field: '${field}'. This field is not part of the block.json schema.`,
        severity: "warning",
        rule: "unknown-field",
      });
    }
  }

  return { errors, warnings, detectedFields, missingRequired };
}

function validateThemeJson(parsed: Record<string, unknown>): { errors: ValidationError[]; warnings: ValidationWarning[]; detectedFields: string[]; missingRequired: string[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const detectedFields = Object.keys(parsed);
  const missingRequired: string[] = [];

  // Check required fields
  for (const field of THEME_JSON_REQUIRED_FIELDS) {
    if (!(field in parsed)) {
      if (field === "$schema") {
        warnings.push({
          message: `Missing '$schema'. Recommended: "https://schemas.wp.org/trunk/theme.json"`,
          severity: "warning",
          rule: "missing-schema",
          suggestion: `Add: "$schema": "https://schemas.wp.org/trunk/theme.json"`,
        });
      } else {
        missingRequired.push(field);
        errors.push({
          message: `Missing required field: '${field}'`,
          severity: "error",
          rule: "missing-required-field",
        });
      }
    }
  }

  // Validate version
  if ("version" in parsed && !THEME_JSON_VALID_VERSIONS.includes(parsed.version as number)) {
    errors.push({
      message: `Invalid theme.json version: ${parsed.version}. Must be one of: ${THEME_JSON_VALID_VERSIONS.join(", ")}`,
      severity: "error",
      rule: "invalid-theme-json-version",
    });
  }

  // Check unknown top-level keys
  for (const key of detectedFields) {
    if (!THEME_JSON_TOP_LEVEL_KEYS.includes(key)) {
      warnings.push({
        message: `Unknown top-level key: '${key}'.`,
        severity: "warning",
        rule: "unknown-theme-json-key",
      });
    }
  }

  // Validate settings structure
  if ("settings" in parsed && typeof parsed.settings === "object" && parsed.settings !== null) {
    const settings = parsed.settings as Record<string, unknown>;
    const knownSettings = [
      "appearanceTools", "border", "color", "custom", "dimensions",
      "layout", "lightbox", "position", "shadow", "spacing",
      "typography", "useRootPaddingAwareAlignments", "blocks",
    ];
    for (const key of Object.keys(settings)) {
      if (!knownSettings.includes(key)) {
        warnings.push({
          message: `Unknown settings key: '${key}'.`,
          severity: "warning",
          rule: "unknown-settings-key",
        });
      }
    }
  }

  return { errors, warnings, detectedFields, missingRequired };
}

export async function validateBlockJsonTool(input: ValidateBlockJsonInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const { json, type, revision } = input;
    const artifactId = input.artifactId ?? uuidv4();
    logger.info("validate_block_json called", { type, artifactId, revision });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(json);
    } catch (parseError) {
      return errorResponse(
        `Invalid JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}\n\nMake sure the input is valid JSON.`
      );
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return errorResponse("JSON must be an object, not an array or primitive.");
    }

    const { errors, warnings, detectedFields, missingRequired } =
      type === "theme" ? validateThemeJson(parsed) : validateBlockJson(parsed);

    const result: BlockJsonValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      artifactId,
      revision,
      blockName: type === "block" ? (parsed.name as string | undefined) : undefined,
      detectedFields,
      missingRequiredFields: missingRequired,
    };

    const statusEmoji = result.valid ? "✅" : "❌";
    const fileType = type === "theme" ? "theme.json" : "block.json";
    const errorsText = errors.length > 0
      ? errors.map((e) => `- [${e.rule}]: ${e.message}${e.suggestion ? `\n  💡 ${e.suggestion}` : ""}`).join("\n")
      : "_(none)_";
    const warningsText = warnings.length > 0
      ? warnings.map((w) => `- [${w.rule}]: ${w.message}${w.suggestion ? `\n  💡 ${w.suggestion}` : ""}`).join("\n")
      : "_(none)_";

    const response = `# ${fileType} Validation Result ${statusEmoji}

**Artifact ID**: \`${result.artifactId}\`
**Revision**: ${result.revision}
**Type**: ${fileType}
${result.blockName ? `**Block Name**: ${result.blockName}\n` : ""}**Detected Fields**: ${detectedFields.join(", ")}
**Status**: ${result.valid ? "VALID" : "INVALID"}

## Errors (${errors.length})
${errorsText}

## Warnings (${warnings.length})
${warningsText}

---

${!result.valid ? `⚠️ Fix the errors and re-validate with artifactId: "${result.artifactId}" and revision: ${result.revision + 1}` : `✅ ${fileType} is valid.`}`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("validate_block_json failed", { error: message });
    return errorResponse(message);
  }
}

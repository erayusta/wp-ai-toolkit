/**
 * Tool registry — exports all tool schemas and handlers.
 */

export { learnWordPressApiSchema, learnWordPressApi } from "./learn-wordpress-api.js";
export { searchDocsSchema, searchDocs } from "./search-docs.js";
export { fetchFullDocsSchema, fetchFullDocs } from "./fetch-full-docs.js";
export { introspectRestApiSchema, introspectRestApi } from "./introspect-rest-api.js";
export { validatePhpSchema, validatePhp } from "./validate-php.js";
export { validateBlockJsonSchema, validateBlockJsonTool } from "./validate-block-json.js";
export { manageWpSiteSchema, manageWpSite } from "./manage-wp-site.js";
export { validateThemeTemplateSchema, validateThemeTemplate } from "./validate-theme-template.js";
export { scaffoldComponentSchema, scaffoldComponent } from "./scaffold-component.js";
export { analyzeThemeSchema, analyzeTheme } from "./analyze-theme.js";
export { analyzePluginSchema, analyzePlugin } from "./analyze-plugin.js";
export { analyzeContentSeoSchema, analyzeContentSeo } from "./analyze-content-seo.js";
export { publishToWordPressSchema, publishToWordPress } from "./publish-to-wordpress.js";
export { analyzeCompetitorsSchema, analyzeCompetitors } from "./analyze-competitors.js";
export { scoreContentQualitySchema, scoreContentQuality } from "./score-content-quality.js";

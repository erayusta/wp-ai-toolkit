import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateThemeTemplate } from "../../src/tools/validate-theme-template.js";
import { createConversation, addApiToConversation } from "../../src/utils/conversation.js";

vi.mock("../../src/utils/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("validate_theme_template", () => {
  let conversationId: string;

  beforeEach(() => {
    const conv = createConversation();
    addApiToConversation(conv.id, "themes");
    conversationId = conv.id;
  });

  it("passes valid index.php template", async () => {
    const result = await validateThemeTemplate({
      code: `<?php get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
  <h2><?php the_title(); ?></h2>
  <?php the_content(); ?>
<?php endwhile; endif; ?>
<?php get_footer(); ?>`,
      conversationId,
      templateType: "index",
    });
    expect(result.content[0].text).toContain("VALID");
  });

  it("detects missing get_header in full-page template", async () => {
    const result = await validateThemeTemplate({
      code: `<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
  <?php the_title(); ?>
<?php endwhile; endif; ?>
<?php get_footer(); ?>`,
      conversationId,
      templateType: "single",
    });
    expect(result.content[0].text).toContain("missing-get-header");
  });

  it("detects missing get_footer in full-page template", async () => {
    const result = await validateThemeTemplate({
      code: `<?php get_header(); ?>
<p>Content</p>`,
      conversationId,
      templateType: "page",
    });
    expect(result.content[0].text).toContain("missing-get-footer");
  });

  it("detects missing wp_head in header template", async () => {
    const result = await validateThemeTemplate({
      code: `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>`,
      conversationId,
      templateType: "header",
    });
    expect(result.content[0].text).toContain("missing-wp-head");
  });

  it("detects missing wp_footer in footer template", async () => {
    const result = await validateThemeTemplate({
      code: `</main>
<footer>Copyright</footer>
</body></html>`,
      conversationId,
      templateType: "footer",
    });
    expect(result.content[0].text).toContain("missing-wp-footer");
  });

  it("detects missing wp_reset_postdata for custom WP_Query", async () => {
    const result = await validateThemeTemplate({
      code: `<?php
get_header();
$query = new WP_Query(['post_type' => 'post']);
while ($query->have_posts()) { $query->the_post(); the_title(); }
get_footer();`,
      conversationId,
      templateType: "index",
    });
    expect(result.content[0].text).toContain("missing-reset-postdata");
  });

  it("warns about unescaped get_field output", async () => {
    const result = await validateThemeTemplate({
      code: `<?php echo get_field('subtitle'); ?>`,
      conversationId,
    });
    expect(result.content[0].text).toContain("unescaped-acf");
  });

  it("warns about hardcoded script tags", async () => {
    const result = await validateThemeTemplate({
      code: `<script src="https://cdn.example.com/script.js"></script>`,
      conversationId,
    });
    expect(result.content[0].text).toContain("hardcoded-script");
  });

  it("warns about missing search form in 404 template", async () => {
    const result = await validateThemeTemplate({
      code: `<?php get_header(); ?>
<h1>Not Found</h1>
<p>Sorry, nothing here.</p>
<?php get_footer(); ?>`,
      conversationId,
      templateType: "404",
    });
    expect(result.content[0].text).toContain("404-no-search");
  });

  it("skips classic checks for block themes", async () => {
    const result = await validateThemeTemplate({
      code: `<!-- wp:template-part {"slug":"header"} /-->
<!-- wp:post-content /-->
<!-- wp:template-part {"slug":"footer"} /-->`,
      conversationId,
      templateType: "index",
      themeType: "block",
    });
    // Block themes don't need get_header/get_footer
    expect(result.content[0].text).not.toContain("missing-get-header");
  });
});

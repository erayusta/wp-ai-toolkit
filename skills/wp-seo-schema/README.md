# WP SEO & Schema

> Implement JSON-LD structured data, Open Graph tags, and integrate Yoast/RankMath

## What This Skill Covers

- Adding JSON-LD schema markup for articles, products, and FAQs
- Implementing Open Graph and Twitter Card meta tags
- Extending Yoast SEO and RankMath with custom schema
- Building breadcrumb and organization structured data

## Example Usage

Ask your AI assistant:

```
> "Add FAQ schema and Open Graph tags for blog posts on wordpress.test"
```

### Example Output

```php
// Add FAQ JSON-LD schema to posts that have FAQ blocks
add_action( 'wp_head', 'add_faq_schema' );

function add_faq_schema() {
    if ( ! is_singular( 'post' ) ) {
        return;
    }

    $post    = get_post();
    $blocks  = parse_blocks( $post->post_content );
    $faqs    = array();

    foreach ( $blocks as $block ) {
        if ( 'core/details' === $block['blockName'] ) {
            $question = wp_strip_all_tags( $block['attrs']['summary'] ?? '' );
            $answer   = wp_strip_all_tags( render_block( $block ) );
            if ( $question && $answer ) {
                $faqs[] = array(
                    '@type'          => 'Question',
                    'name'           => $question,
                    'acceptedAnswer' => array(
                        '@type' => 'Answer',
                        'text'  => $answer,
                    ),
                );
            }
        }
    }

    if ( empty( $faqs ) ) {
        return;
    }

    $schema = array(
        '@context'   => 'https://schema.org',
        '@type'      => 'FAQPage',
        'mainEntity' => $faqs,
    );

    printf(
        '<script type="application/ld+json">%s</script>' . "\n",
        wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
    );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_seo` | Validates schema markup and meta tags |
| `validate_json` | Checks JSON-LD syntax and schema.org compliance |
| `check_serp` | Previews rich snippet appearance in search results |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

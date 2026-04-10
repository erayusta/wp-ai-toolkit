# WP Multilingual

> Set up WPML, Polylang, Weglot, hreflang tags, and RTL support

## What This Skill Covers

- Configuring WPML or Polylang for multi-language content
- Implementing automatic translation with Weglot
- Adding proper hreflang tags for international SEO
- Supporting RTL languages with CSS and theme adjustments

## Example Usage

Ask your AI assistant:

```
> "Add hreflang tags and Polylang language switcher on wordpress.test"
```

### Example Output

```php
// Add hreflang tags to <head> for all translated pages
add_action( 'wp_head', 'add_hreflang_tags' );

function add_hreflang_tags() {
    if ( ! function_exists( 'pll_the_languages' ) ) {
        return;
    }

    $translations = pll_the_languages( array(
        'raw'               => 1,
        'hide_if_no_translation' => 0,
    ) );

    foreach ( $translations as $lang ) {
        printf(
            '<link rel="alternate" hreflang="%s" href="%s" />' . "\n",
            esc_attr( $lang['locale'] ),
            esc_url( $lang['url'] )
        );
    }

    // x-default for language selector page
    printf(
        '<link rel="alternate" hreflang="x-default" href="%s" />' . "\n",
        esc_url( home_url( '/' ) )
    );
}

// Custom language switcher shortcode
add_shortcode( 'lang_switcher', function() {
    if ( ! function_exists( 'pll_the_languages' ) ) {
        return '';
    }

    $output = '<ul class="language-switcher">';
    $langs  = pll_the_languages( array( 'raw' => 1 ) );

    foreach ( $langs as $lang ) {
        $active = $lang['current_lang'] ? ' class="active"' : '';
        $output .= sprintf(
            '<li%s><a href="%s" lang="%s">%s</a></li>',
            $active,
            esc_url( $lang['url'] ),
            esc_attr( $lang['locale'] ),
            esc_html( $lang['name'] )
        );
    }

    return $output . '</ul>';
} );
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_seo` | Validates hreflang implementation and locale codes |
| `analyze_theme` | Checks theme RTL stylesheet support |
| `validate_php` | Verifies translation function usage |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

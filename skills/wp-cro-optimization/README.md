# WP CRO Optimization

> Optimize landing pages, forms, CTAs, and run A/B tests for conversions

## What This Skill Covers

- Designing high-converting landing pages with clear value propositions
- Optimizing form fields, placement, and multi-step forms
- Creating and testing CTAs with color, copy, and placement variations
- Setting up A/B tests with Google Optimize or custom solutions

## Example Usage

Ask your AI assistant:

```
> "Create an A/B test for the hero CTA button on wordpress.test homepage"
```

### Example Output

```php
// Simple A/B test for hero CTA without external dependencies
add_filter( 'the_content', 'ab_test_hero_cta' );

function ab_test_hero_cta( $content ) {
    if ( ! is_front_page() ) {
        return $content;
    }

    // Assign variant based on cookie or random
    if ( isset( $_COOKIE['ab_hero_cta'] ) ) {
        $variant = sanitize_key( $_COOKIE['ab_hero_cta'] );
    } else {
        $variant = wp_rand( 0, 1 ) === 0 ? 'control' : 'variant_b';
        setcookie( 'ab_hero_cta', $variant, time() + DAY_IN_SECONDS * 30, '/' );
    }

    $cta_text = $variant === 'control'
        ? 'Get Started Free'
        : 'Start Your Free Trial Today';

    $cta_class = $variant === 'control'
        ? 'btn-primary'
        : 'btn-primary btn-large';

    $cta_html = sprintf(
        '<a href="/signup/" class="%s" data-ab-variant="%s">%s</a>',
        esc_attr( $cta_class ),
        esc_attr( $variant ),
        esc_html( $cta_text )
    );

    return str_replace( '{{hero_cta}}', $cta_html, $content );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_content` | Reviews landing page structure for CRO best practices |
| `check_performance` | Ensures test scripts don't slow page load |
| `validate_php` | Checks A/B test implementation for errors |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

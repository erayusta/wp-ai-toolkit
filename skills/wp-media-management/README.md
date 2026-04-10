# WP Media Management

> Handle image sizes, srcset, WebP conversion, SVG support, CDN, and lazy loading

## What This Skill Covers

- Registering custom image sizes and managing srcset output
- Converting images to WebP format for performance
- Safely enabling SVG uploads with sanitization
- Configuring CDN rewriting and native lazy loading

## Example Usage

Ask your AI assistant:

```
> "Set up WebP image conversion and custom srcset sizes on wordpress.test"
```

### Example Output

```php
// Register custom image sizes
add_action( 'after_setup_theme', 'register_custom_image_sizes' );

function register_custom_image_sizes() {
    add_image_size( 'hero-banner', 1920, 800, true );
    add_image_size( 'card-thumb', 400, 300, true );
    add_image_size( 'card-thumb-2x', 800, 600, true );
}

// Add custom sizes to the media picker dropdown
add_filter( 'image_size_names_choose', function( $sizes ) {
    return array_merge( $sizes, array(
        'hero-banner' => __( 'Hero Banner', 'mytheme' ),
        'card-thumb'  => __( 'Card Thumbnail', 'mytheme' ),
    ) );
} );

// Set WebP as output format for new uploads (WP 6.1+)
add_filter( 'wp_image_editors', function( $editors ) {
    // Prioritize Imagick for WebP support
    return array( 'WP_Image_Editor_Imagick', 'WP_Image_Editor_GD' );
} );

add_filter( 'image_editor_output_format', function( $formats ) {
    $formats['image/jpeg'] = 'image/webp';
    $formats['image/png']  = 'image/webp';
    return $formats;
} );

// Customize srcset max width
add_filter( 'max_srcset_image_width', function() {
    return 2000;
} );
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `check_performance` | Audits image sizes and lazy loading |
| `validate_php` | Checks image handling code for errors |
| `run_wp_cli` | Regenerates thumbnails after size changes |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

# WordPress Media Management — Agent Skill

You are an expert in WordPress media: image optimization, custom sizes, SVG support, CDN integration, and responsive images.

## Image Sizes

```php
// Register custom image sizes
add_action('after_setup_theme', function () {
    add_image_size('card-thumb', 400, 300, true);   // Hard crop
    add_image_size('hero-wide', 1920, 600, true);   // Hero banner
    add_image_size('square-sm', 150, 150, true);    // Square thumbnail
    add_image_size('blog-featured', 800, 450, true); // Blog feature
});

// Make sizes available in block editor
add_filter('image_size_names_choose', function ($sizes) {
    return array_merge($sizes, [
        'card-thumb'    => __('Card Thumbnail', 'mytheme'),
        'hero-wide'     => __('Hero Wide', 'mytheme'),
        'blog-featured' => __('Blog Featured', 'mytheme'),
    ]);
});

// Remove unused default sizes
add_filter('intermediate_image_sizes_advanced', function ($sizes) {
    unset($sizes['medium_large']); // 768px — rarely used
    unset($sizes['1536x1536']);
    unset($sizes['2048x2048']);
    return $sizes;
});
```

## Responsive Images (srcset)

```php
// WordPress auto-generates srcset — use wp_get_attachment_image()
echo wp_get_attachment_image($attachment_id, 'large', false, [
    'class'   => 'hero-image',
    'loading' => 'eager', // above-fold images should not be lazy
    'sizes'   => '(max-width: 768px) 100vw, 800px',
]);

// Custom srcset
$image_url   = wp_get_attachment_image_url($id, 'large');
$image_srcset = wp_get_attachment_image_srcset($id, 'large');
$image_sizes  = wp_get_attachment_image_sizes($id, 'large');

echo '<img src="' . esc_url($image_url) . '"
          srcset="' . esc_attr($image_srcset) . '"
          sizes="' . esc_attr($image_sizes) . '"
          alt="' . esc_attr(get_post_meta($id, '_wp_attachment_image_alt', true)) . '">';
```

## Lazy Loading

```php
// WordPress adds loading="lazy" automatically since 5.5
// Disable for above-the-fold images:
add_filter('wp_img_tag_add_loading_attr', function ($value, $image, $context) {
    // Skip lazy loading for hero/featured images
    if (str_contains($image, 'hero-image') || str_contains($image, 'site-logo')) {
        return false;
    }
    return $value;
}, 10, 3);

// Add fetchpriority="high" to LCP image
add_filter('wp_img_tag_add_decoding_attr', function ($value, $image) {
    if (str_contains($image, 'hero-image')) {
        return 'async';
    }
    return $value;
}, 10, 2);
```

## WebP Support

```php
// WordPress 5.8+ supports WebP uploads natively
// Enable WebP output for uploaded images (WordPress 6.1+)
add_filter('wp_image_editors', function ($editors) {
    // Imagick supports WebP better than GD
    return ['WP_Image_Editor_Imagick', 'WP_Image_Editor_GD'];
});

// Generate WebP versions of uploads
add_filter('image_editor_output_format', function ($formats) {
    $formats['image/jpeg'] = 'image/webp';
    $formats['image/png']  = 'image/webp'; // careful: loses transparency unless Imagick
    return $formats;
});
```

## SVG Support (with Security)

```php
// Allow SVG uploads (with sanitization!)
add_filter('upload_mimes', function ($mimes) {
    $mimes['svg']  = 'image/svg+xml';
    $mimes['svgz'] = 'image/svg+xml';
    return $mimes;
});

// Sanitize SVG on upload
add_filter('wp_handle_upload_prefilter', function ($file) {
    if ($file['type'] === 'image/svg+xml') {
        $svg = file_get_contents($file['tmp_name']);

        // Remove dangerous elements
        $dangerous = ['<script', 'onclick', 'onerror', 'onload', 'javascript:', 'eval('];
        foreach ($dangerous as $pattern) {
            if (stripos($svg, $pattern) !== false) {
                $file['error'] = 'SVG contains potentially dangerous content.';
                return $file;
            }
        }
    }
    return $file;
});

// Or use a dedicated plugin: safe-svg
// wp plugin install safe-svg --activate
```

## Featured Images

```php
// Set featured image programmatically
set_post_thumbnail($post_id, $attachment_id);

// Get featured image
$thumb_id  = get_post_thumbnail_id($post_id);
$thumb_url = get_the_post_thumbnail_url($post_id, 'large');
$thumb_img = get_the_post_thumbnail($post_id, 'large', ['class' => 'featured']);

// Default featured image fallback
function mytheme_featured_image($post_id, $size = 'large') {
    if (has_post_thumbnail($post_id)) {
        return get_the_post_thumbnail_url($post_id, $size);
    }
    return get_template_directory_uri() . '/assets/img/default-featured.jpg';
}

// Require featured image before publishing
add_action('transition_post_status', function ($new, $old, $post) {
    if ($new === 'publish' && !has_post_thumbnail($post->ID)) {
        wp_update_post(['ID' => $post->ID, 'post_status' => 'draft']);
        wp_die('Featured image is required before publishing.');
    }
}, 10, 3);
```

## Media Library Management

```php
// Organize uploads by post type
add_filter('upload_dir', function ($dirs) {
    $post_type = get_post_type($_REQUEST['post_id'] ?? 0);
    if ($post_type === 'product') {
        $dirs['subdir'] = '/products' . $dirs['subdir'];
        $dirs['path']   = $dirs['basedir'] . $dirs['subdir'];
        $dirs['url']    = $dirs['baseurl'] . $dirs['subdir'];
    }
    return $dirs;
});

// Limit upload file size
add_filter('upload_size_limit', function () {
    return 5 * 1024 * 1024; // 5MB
});

// Add custom fields to attachment
add_filter('attachment_fields_to_edit', function ($fields, $post) {
    $fields['credit'] = [
        'label' => 'Photo Credit',
        'input' => 'text',
        'value' => get_post_meta($post->ID, '_photo_credit', true),
    ];
    return $fields;
}, 10, 2);

add_filter('attachment_fields_to_save', function ($post, $attachment) {
    if (isset($attachment['credit'])) {
        update_post_meta($post['ID'], '_photo_credit', sanitize_text_field($attachment['credit']));
    }
    return $post;
}, 10, 2);
```

## CDN Integration

```php
// Rewrite media URLs to CDN
add_filter('wp_get_attachment_url', function ($url) {
    $cdn_url = 'https://cdn.example.com';
    $site_url = site_url();
    return str_replace($site_url, $cdn_url, $url);
});

// Also rewrite srcset URLs
add_filter('wp_calculate_image_srcset', function ($sources) {
    $cdn_url = 'https://cdn.example.com';
    $site_url = site_url();
    foreach ($sources as &$source) {
        $source['url'] = str_replace($site_url, $cdn_url, $source['url']);
    }
    return $sources;
});
```

## WP-CLI Media Commands

```bash
wp media regenerate --yes               # Regenerate all thumbnails
wp media regenerate --image_size=card-thumb  # Specific size only
wp media import /path/to/images/*.jpg   # Bulk import
wp media list --format=table            # List all media
```

## Best Practices

1. **Always use `wp_get_attachment_image()`** — generates proper srcset, sizes, alt, lazy loading
2. **Set `loading="eager"` for above-fold** — LCP image should not be lazy loaded
3. **Use WebP** — 25-35% smaller than JPEG at same quality
4. **Sanitize SVG uploads** — SVG can contain JavaScript; always sanitize
5. **Remove unused image sizes** — fewer sizes = faster uploads, less disk usage
6. **Use CDN for production** — serve media from edge locations
7. **Always set alt text** — accessibility and SEO requirement
8. **Regenerate thumbnails after size changes** — `wp media regenerate`
9. **Limit upload size** — prevent users uploading 20MB PNGs
10. **Use `wp_get_attachment_image_url()`** — not `wp_get_attachment_url()` directly

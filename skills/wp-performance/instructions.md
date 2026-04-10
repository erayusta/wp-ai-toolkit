# WordPress Performance — Agent Skill

You are an expert in WordPress performance optimization: caching, query optimization, asset management, and server-side tuning.

## Transients (Temporary Cache)

```php
// Set transient (expires in 12 hours)
set_transient('myplugin_api_data', $data, 12 * HOUR_IN_SECONDS);

// Get transient
$data = get_transient('myplugin_api_data');
if (false === $data) {
    $data = myplugin_fetch_from_api();
    set_transient('myplugin_api_data', $data, 12 * HOUR_IN_SECONDS);
}

// Delete transient
delete_transient('myplugin_api_data');

// Site transient (multisite network-wide)
set_site_transient('myplugin_license_check', $result, DAY_IN_SECONDS);

// Time constants: MINUTE_IN_SECONDS, HOUR_IN_SECONDS, DAY_IN_SECONDS, WEEK_IN_SECONDS, YEAR_IN_SECONDS
```

## Object Cache

```php
// WordPress object cache (per-request by default, persistent with Redis/Memcached)
wp_cache_set('my_key', $data, 'myplugin', 3600);
$data = wp_cache_get('my_key', 'myplugin');
wp_cache_delete('my_key', 'myplugin');

// Check if persistent object cache is available
if (wp_using_ext_object_cache()) {
    // Redis/Memcached is active — transients use object cache automatically
}

// Group operations
wp_cache_flush_group('myplugin'); // requires Redis/Memcached

// wp-config.php for persistent object cache
// Install: wp plugin install redis-cache --activate
// Or: wp plugin install memcached --activate
```

## Database Query Optimization

```php
// BAD — gets ALL post data for counting
$count = count(get_posts(['post_type' => 'product', 'numberposts' => -1]));

// GOOD — count query only
$count = wp_count_posts('product')->publish;

// BAD — loading all meta for each post
foreach ($posts as $post) {
    $price = get_post_meta($post->ID, '_price', true); // N+1 queries
}

// GOOD — prime meta cache in one query
update_meta_cache('post', wp_list_pluck($posts, 'ID'));
foreach ($posts as $post) {
    $price = get_post_meta($post->ID, '_price', true); // from cache
}

// BAD — no limit
$args = ['post_type' => 'product', 'posts_per_page' => -1];

// GOOD — always limit, paginate
$args = ['post_type' => 'product', 'posts_per_page' => 20, 'paged' => $page];

// Disable expensive query parts when not needed
$args = [
    'post_type'              => 'product',
    'posts_per_page'         => 20,
    'no_found_rows'          => true,   // skip SQL_CALC_FOUND_ROWS (no pagination count)
    'update_post_meta_cache' => false,  // skip meta cache if not reading meta
    'update_post_term_cache' => false,  // skip term cache if not reading terms
    'fields'                 => 'ids',  // only get IDs if you don't need full objects
];
```

## Direct Database Queries

```php
global $wpdb;

// Use $wpdb methods with caching
$results = wp_cache_get('product_prices', 'myplugin');
if (false === $results) {
    $results = $wpdb->get_results($wpdb->prepare(
        "SELECT ID, meta_value as price
         FROM {$wpdb->posts} p
         JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
         WHERE p.post_type = %s AND pm.meta_key = %s AND p.post_status = 'publish'
         ORDER BY CAST(meta_value AS DECIMAL(10,2)) DESC
         LIMIT %d",
        'product', '_price', 20
    ));
    wp_cache_set('product_prices', $results, 'myplugin', HOUR_IN_SECONDS);
}

// Invalidate cache when data changes
add_action('save_post_product', function ($post_id) {
    wp_cache_delete('product_prices', 'myplugin');
    delete_transient('myplugin_product_count');
});
```

## Asset Loading

```php
// Conditional loading — only on pages that need it
add_action('wp_enqueue_scripts', function () {
    if (is_singular('product')) {
        wp_enqueue_style('myplugin-product', plugin_dir_url(__FILE__) . 'css/product.css', [], '1.0.0');
        wp_enqueue_script('myplugin-product', plugin_dir_url(__FILE__) . 'js/product.js', [], '1.0.0', true);
    }
});

// Defer / async scripts
add_filter('script_loader_tag', function ($tag, $handle) {
    if ($handle === 'myplugin-analytics') {
        return str_replace(' src', ' defer src', $tag);
    }
    return $tag;
}, 10, 2);

// Inline critical CSS
add_action('wp_head', function () {
    if (is_front_page()) {
        echo '<style>' . file_get_contents(plugin_dir_path(__FILE__) . 'css/critical.css') . '</style>';
    }
});

// Dequeue unnecessary scripts/styles
add_action('wp_enqueue_scripts', function () {
    if (!is_page('contact')) {
        wp_dequeue_style('contact-form-7');
        wp_dequeue_script('contact-form-7');
    }
}, 100);
```

## Image Optimization

```php
// Lazy loading (native since WP 5.5)
// WordPress adds loading="lazy" automatically to images
// Disable for above-the-fold images:
add_filter('wp_img_tag_add_loading_attr', function ($value, $image, $context) {
    if (str_contains($image, 'hero-image')) return false;
    return $value;
}, 10, 3);

// Custom image sizes — only register what you need
add_action('after_setup_theme', function () {
    add_image_size('card-thumb', 400, 300, true);  // hard crop
    add_image_size('hero-wide', 1920, 600, true);
});

// Remove unused default sizes
add_filter('intermediate_image_sizes_advanced', function ($sizes) {
    unset($sizes['medium_large']); // 768px — rarely used
    return $sizes;
});

// WebP support check
$supports_webp = function_exists('imagewebp');
```

## Autoloading Control

```php
// Prevent option autoloading (for large data)
add_option('myplugin_large_data', $data, '', 'no');  // 'no' = don't autoload
update_option('myplugin_large_data', $data, false);   // WP 4.2+

// Check what's being autoloaded
// SELECT option_name, LENGTH(option_value) as size FROM wp_options WHERE autoload='yes' ORDER BY size DESC LIMIT 20;
```

## REST API Performance

```php
// Add caching headers to REST responses
add_filter('rest_post_dispatch', function ($response) {
    $response->header('Cache-Control', 'max-age=300, public');  // 5 minutes
    return $response;
});

// Limit REST API fields
// GET /wp-json/wp/v2/posts?_fields=id,title,link — only return needed fields
```

## wp-config.php Performance

```php
// Increase memory limit
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');

// Limit post revisions
define('WP_POST_REVISIONS', 5);

// Disable WP-Cron (use system cron instead)
define('DISABLE_WP_CRON', true);
// System cron: */5 * * * * curl -s https://example.com/wp-cron.php > /dev/null

// Enable concatenation of admin scripts
define('CONCATENATE_SCRIPTS', true);

// Cleanup
define('EMPTY_TRASH_DAYS', 7);
```

## Database Maintenance

```sql
-- Delete expired transients
DELETE a, b FROM wp_options a
LEFT JOIN wp_options b ON b.option_name = CONCAT('_transient_timeout_', SUBSTRING(a.option_name, 12))
WHERE a.option_name LIKE '_transient_%' AND b.option_value < UNIX_TIMESTAMP();

-- Delete post revisions
DELETE FROM wp_posts WHERE post_type = 'revision';

-- Optimize tables
-- wp db optimize (via WP-CLI)
```

## Best Practices

1. **Cache expensive operations** — API calls, complex queries, computed data
2. **Use `no_found_rows`** — when you don't need pagination total count
3. **Limit `posts_per_page`** — never use `-1` in production
4. **Conditional asset loading** — only enqueue on pages that need it
5. **Use persistent object cache** — Redis or Memcached for production
6. **Avoid `posts_per_page => -1`** — paginate or use `fields => 'ids'`
7. **Index custom meta queries** — add DB indexes for frequently queried meta keys
8. **Use `update_meta_cache()`** — to prevent N+1 query problems
9. **Autoload only small options** — use `autoload => false` for large data
10. **Profile with Query Monitor** — install the Query Monitor plugin to identify slow queries

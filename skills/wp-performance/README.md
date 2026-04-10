# WP Performance

> Optimize with object cache, transients, query optimization, and lazy loading

## What This Skill Covers

- Setting up Redis or Memcached object caching
- Using transients for expensive query caching
- Optimizing WP_Query and database queries for speed
- Implementing lazy loading for images, iframes, and scripts

## Example Usage

Ask your AI assistant:

```
> "Add transient caching for an expensive WP_Query on wordpress.test"
```

### Example Output

```php
function get_featured_products( int $count = 12 ) : array {
    $cache_key = 'featured_products_' . $count;
    $products  = get_transient( $cache_key );

    if ( false !== $products ) {
        return $products;
    }

    $query = new WP_Query( array(
        'post_type'      => 'product',
        'posts_per_page' => $count,
        'meta_query'     => array(
            array(
                'key'   => '_featured',
                'value' => 'yes',
            ),
        ),
        'tax_query'      => array(
            array(
                'taxonomy' => 'product_visibility',
                'field'    => 'name',
                'terms'    => 'exclude-from-catalog',
                'operator' => 'NOT IN',
            ),
        ),
        'fields'         => 'ids',
        'no_found_rows'  => true,
        'update_post_meta_cache' => true,
        'update_post_term_cache' => false,
    ) );

    $products = $query->posts;

    // Cache for 1 hour
    set_transient( $cache_key, $products, HOUR_IN_SECONDS );

    return $products;
}

// Bust cache when products are updated
add_action( 'save_post_product', function( $post_id ) {
    delete_transient( 'featured_products_12' );
} );
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `check_performance` | Profiles page load time and query count |
| `analyze_database` | Identifies slow queries and missing indexes |
| `run_wp_cli` | Flushes object cache and transients |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

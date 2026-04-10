# WP Multisite

> Manage network admin, switch_to_blog, shared tables, and multisite architecture

## What This Skill Covers

- Setting up and configuring WordPress Multisite networks
- Using switch_to_blog for cross-site queries and data sharing
- Managing network-wide plugins and themes
- Working with shared user tables and site-specific options

## Example Usage

Ask your AI assistant:

```
> "Query recent posts from all sites in the multisite network on wordpress.test"
```

### Example Output

```php
// Get latest 5 posts from each site in the network
function get_network_recent_posts( int $per_site = 5 ) : array {
    $sites = get_sites( array(
        'public'   => 1,
        'archived' => 0,
        'deleted'  => 0,
        'number'   => 50,
    ) );

    $all_posts = array();

    foreach ( $sites as $site ) {
        switch_to_blog( $site->blog_id );

        $posts = get_posts( array(
            'posts_per_page' => $per_site,
            'post_status'    => 'publish',
            'orderby'        => 'date',
            'order'          => 'DESC',
        ) );

        foreach ( $posts as $post ) {
            $all_posts[] = array(
                'blog_id'   => $site->blog_id,
                'blog_name' => get_bloginfo( 'name' ),
                'title'     => $post->post_title,
                'url'       => get_permalink( $post ),
                'date'      => $post->post_date,
                'excerpt'   => get_the_excerpt( $post ),
            );
        }

        restore_current_blog();
    }

    // Sort all posts by date descending
    usort( $all_posts, function( $a, $b ) {
        return strtotime( $b['date'] ) - strtotime( $a['date'] );
    } );

    return $all_posts;
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `run_wp_cli` | Manages sites with wp site list and create commands |
| `analyze_database` | Inspects per-site and shared tables |
| `validate_php` | Checks switch_to_blog/restore_current_blog pairing |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

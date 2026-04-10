# WP Database

> Create custom tables, use dbDelta, optimize queries, and manage database cleanup

## What This Skill Covers

- Creating custom database tables with dbDelta on activation
- Writing efficient $wpdb queries with proper preparation
- Optimizing slow queries with indexes and query analysis
- Cleaning up orphaned data, transients, and revisions

## Example Usage

Ask your AI assistant:

```
> "Create a custom analytics table with proper indexes on wordpress.test"
```

### Example Output

```php
register_activation_hook( __FILE__, 'myplugin_create_analytics_table' );

function myplugin_create_analytics_table() {
    global $wpdb;
    $table_name      = $wpdb->prefix . 'page_analytics';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        post_id bigint(20) unsigned NOT NULL,
        visitor_hash varchar(64) NOT NULL,
        page_url varchar(2083) NOT NULL,
        referrer varchar(2083) DEFAULT '',
        duration smallint unsigned DEFAULT 0,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY post_id (post_id),
        KEY created_at (created_at),
        KEY visitor_hash (visitor_hash)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );

    update_option( 'myplugin_db_version', '1.0' );
}

// Query with proper preparation
function myplugin_get_page_views( int $post_id, string $start_date ) {
    global $wpdb;
    $table = $wpdb->prefix . 'page_analytics';

    return (int) $wpdb->get_var(
        $wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE post_id = %d AND created_at >= %s",
            $post_id,
            $start_date
        )
    );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_database` | Inspects table structure, sizes, and indexes |
| `validate_php` | Checks $wpdb queries for SQL injection risks |
| `run_wp_cli` | Runs database operations and search-replace |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

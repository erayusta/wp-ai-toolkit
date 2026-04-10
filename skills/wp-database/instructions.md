# WordPress Database — Agent Skill

You are an expert in WordPress database operations: custom tables, optimization, cleanup, and query performance.

## WordPress Database Schema

```
wp_posts            — Posts, pages, CPTs, revisions, attachments
wp_postmeta         — Post metadata (key-value pairs)
wp_users            — User accounts
wp_usermeta         — User metadata
wp_terms            — Taxonomy terms (categories, tags, custom)
wp_term_taxonomy    — Term-taxonomy relationships
wp_term_relationships — Object-term relationships
wp_options          — Site settings (autoloaded on every page)
wp_comments         — Comments
wp_commentmeta      — Comment metadata
wp_links            — Blogroll links (deprecated)
```

## Custom Tables with dbDelta

```php
// Create custom table on plugin activation
function myplugin_create_tables() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();
    $table   = $wpdb->prefix . 'myplugin_logs';

    // dbDelta rules:
    // - Each field on its own line
    // - TWO spaces between field name and type
    // - PRIMARY KEY on its own line with TWO spaces before
    // - KEY (not INDEX) for secondary indexes
    // - Must include full CREATE TABLE statement

    $sql = "CREATE TABLE {$table} (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        user_id bigint(20) unsigned NOT NULL DEFAULT 0,
        action varchar(100) NOT NULL DEFAULT '',
        object_type varchar(50) NOT NULL DEFAULT '',
        object_id bigint(20) unsigned NOT NULL DEFAULT 0,
        details longtext NOT NULL,
        ip_address varchar(45) NOT NULL DEFAULT '',
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY user_id (user_id),
        KEY action (action),
        KEY object_type_id (object_type, object_id),
        KEY created_at (created_at)
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);

    update_option('myplugin_db_version', '1.0.0');
}
register_activation_hook(__FILE__, 'myplugin_create_tables');
```

## Query Optimization

```php
// BAD: N+1 queries
$posts = get_posts(['numberposts' => 50]);
foreach ($posts as $post) {
    $price = get_post_meta($post->ID, '_price', true); // 50 extra queries!
}

// GOOD: Prime meta cache in one query
$posts = get_posts(['numberposts' => 50]);
update_meta_cache('post', wp_list_pluck($posts, 'ID'));
foreach ($posts as $post) {
    $price = get_post_meta($post->ID, '_price', true); // From cache!
}

// GOOD: Use WP_Query with optimizations
$query = new WP_Query([
    'post_type'              => 'product',
    'posts_per_page'         => 20,
    'no_found_rows'          => true,   // Skip COUNT(*) for pagination
    'update_post_meta_cache' => false,  // Skip if not reading meta
    'update_post_term_cache' => false,  // Skip if not reading terms
    'fields'                 => 'ids',  // Only get IDs
]);

// GOOD: Custom meta query with index
$query = new WP_Query([
    'post_type'  => 'product',
    'meta_query' => [
        [
            'key'     => '_price',
            'value'   => 100,
            'compare' => '>=',
            'type'    => 'NUMERIC',
        ],
    ],
]);
```

## Direct Database Queries

```php
global $wpdb;

// SELECT with prepare (always use prepare!)
$results = $wpdb->get_results($wpdb->prepare(
    "SELECT p.ID, p.post_title, pm.meta_value as price
     FROM {$wpdb->posts} p
     JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
     WHERE p.post_type = %s
       AND p.post_status = 'publish'
       AND pm.meta_key = %s
     ORDER BY CAST(pm.meta_value AS DECIMAL(10,2)) DESC
     LIMIT %d",
    'product', '_price', 20
));

// Single value
$count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish'");

// Single row
$user = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->users} WHERE ID = %d", $user_id));

// INSERT
$wpdb->insert($wpdb->prefix . 'myplugin_logs', [
    'user_id'    => get_current_user_id(),
    'action'     => 'login',
    'created_at' => current_time('mysql'),
], ['%d', '%s', '%s']);
$new_id = $wpdb->insert_id;

// UPDATE
$wpdb->update($wpdb->prefix . 'myplugin_logs',
    ['action' => 'updated'],           // SET
    ['id' => $log_id],                  // WHERE
    ['%s'],                             // SET formats
    ['%d']                              // WHERE formats
);

// DELETE
$wpdb->delete($wpdb->prefix . 'myplugin_logs', ['id' => $log_id], ['%d']);
```

## Database Cleanup

```sql
-- Delete post revisions
DELETE FROM wp_posts WHERE post_type = 'revision';

-- Delete orphaned postmeta
DELETE pm FROM wp_postmeta pm
LEFT JOIN wp_posts p ON pm.post_id = p.ID
WHERE p.ID IS NULL;

-- Delete expired transients
DELETE a, b FROM wp_options a
LEFT JOIN wp_options b ON b.option_name = CONCAT('_transient_timeout_', SUBSTRING(a.option_name, 12))
WHERE a.option_name LIKE '_transient_%'
AND b.option_value IS NOT NULL
AND b.option_value < UNIX_TIMESTAMP();

-- Delete spam/trash comments
DELETE FROM wp_comments WHERE comment_approved = 'spam';
DELETE FROM wp_comments WHERE comment_approved = 'trash';

-- Delete orphaned comment meta
DELETE cm FROM wp_commentmeta cm
LEFT JOIN wp_comments c ON cm.comment_id = c.comment_ID
WHERE c.comment_ID IS NULL;

-- Check autoloaded options size (should be < 1MB)
SELECT SUM(LENGTH(option_value)) as total_bytes
FROM wp_options WHERE autoload = 'yes';

-- Find largest autoloaded options
SELECT option_name, LENGTH(option_value) as size
FROM wp_options WHERE autoload = 'yes'
ORDER BY size DESC LIMIT 20;

-- Optimize tables
OPTIMIZE TABLE wp_posts, wp_postmeta, wp_options, wp_comments;
```

## WP-CLI Database Commands

```bash
wp db size --tables --human-readable     # Table sizes
wp db optimize                            # Optimize all tables
wp db repair                              # Repair tables
wp db check                               # Check for corruption
wp db query "SHOW TABLE STATUS"           # Table stats

# Clean revisions
wp post delete $(wp post list --post_type=revision --format=ids) --force

# Clean transients
wp transient delete --all
wp transient delete --expired

# Find large options
wp db query "SELECT option_name, LENGTH(option_value) as size FROM $(wp db prefix)options WHERE autoload='yes' ORDER BY size DESC LIMIT 10"
```

## Adding Database Indexes

```php
// Add index for frequently queried meta keys
function myplugin_add_meta_index() {
    global $wpdb;
    $table = $wpdb->postmeta;

    // Check if index exists
    $index = $wpdb->get_results("SHOW INDEX FROM {$table} WHERE Key_name = 'myplugin_price_idx'");
    if (empty($index)) {
        $wpdb->query("ALTER TABLE {$table} ADD INDEX myplugin_price_idx (meta_key(20), meta_value(20))");
    }
}
```

## Best Practices

1. **Always use `$wpdb->prepare()`** — for every query with variable data
2. **Use dbDelta for schema** — handles CREATE and ALTER in one function
3. **Index frequently queried columns** — meta_key + meta_value for meta queries
4. **Clean up on uninstall** — drop custom tables, delete options, delete meta
5. **Use `no_found_rows`** — when you don't need pagination count
6. **Batch large operations** — process 100 rows at a time to avoid timeouts
7. **Monitor autoloaded options** — keep total under 1MB, use `autoload => false` for large data
8. **Delete revisions regularly** — they bloat wp_posts table
9. **Use transactions for critical ops** — `$wpdb->query('START TRANSACTION')` ... `COMMIT`
10. **Profile with Query Monitor** — identify slow queries before optimizing blindly

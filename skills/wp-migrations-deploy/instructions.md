# WordPress Migrations & Deployment — Agent Skill

You are an expert in WordPress database migrations, environment management, staging/production deployment, and WP-CLI operations.

## WP-CLI Database Operations

```bash
# Export database
wp db export backup-$(date +%Y%m%d).sql
wp db export --tables=wp_posts,wp_postmeta partial.sql

# Import database
wp db import backup.sql

# Search and replace (dry run first!)
wp search-replace 'http://dev.example.com' 'https://example.com' --dry-run
wp search-replace 'http://dev.example.com' 'https://example.com' --all-tables --precise

# Search-replace with network (multisite)
wp search-replace 'dev.example.com' 'example.com' --network --all-tables

# Database operations
wp db optimize
wp db repair
wp db query "SELECT COUNT(*) FROM wp_posts WHERE post_type='revision'"
wp db size --tables --human-readable

# Delete revisions
wp post delete $(wp post list --post_type='revision' --format=ids) --force

# Delete transients
wp transient delete --all
wp transient delete --expired
```

## Plugin Migration Pattern

```php
<?php
// Track plugin version and run migrations
class MyPlugin_Migrator {
    const VERSION = '2.3.0';

    public static function check() {
        $current = get_option('myplugin_db_version', '0.0.0');
        if (version_compare($current, self::VERSION, '<')) {
            self::migrate($current);
            update_option('myplugin_db_version', self::VERSION);
        }
    }

    private static function migrate($from) {
        global $wpdb;

        // v1.0.0 — Create initial table
        if (version_compare($from, '1.0.0', '<')) {
            $charset = $wpdb->get_charset_collate();
            $wpdb->query("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}myplugin_logs (
                id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                user_id BIGINT(20) UNSIGNED DEFAULT 0,
                action VARCHAR(100) NOT NULL,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY user_id (user_id),
                KEY action (action),
                KEY created_at (created_at)
            ) $charset;");
        }

        // v2.0.0 — Add column
        if (version_compare($from, '2.0.0', '<')) {
            $col_exists = $wpdb->get_var("SHOW COLUMNS FROM {$wpdb->prefix}myplugin_logs LIKE 'severity'");
            if (!$col_exists) {
                $wpdb->query("ALTER TABLE {$wpdb->prefix}myplugin_logs ADD COLUMN severity VARCHAR(20) DEFAULT 'info' AFTER action");
            }
        }

        // v2.3.0 — Migrate option format
        if (version_compare($from, '2.3.0', '<')) {
            $old = get_option('myplugin_config');
            if (is_string($old)) {
                $new = json_decode($old, true) ?: ['mode' => $old];
                update_option('myplugin_config', $new);
            }
        }
    }
}

// Run on admin_init (only fires in admin)
add_action('admin_init', ['MyPlugin_Migrator', 'check']);
```

## dbDelta for Table Creation

```php
// WordPress-recommended way to create/update tables
function myplugin_create_tables() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    // dbDelta is strict about formatting:
    // - Each field on its own line
    // - Two spaces between column name and definition
    // - PRIMARY KEY on its own line with two spaces before
    // - KEY (not INDEX) for secondary indexes
    $sql = "CREATE TABLE {$wpdb->prefix}myplugin_entries (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        title varchar(255) NOT NULL DEFAULT '',
        content longtext NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'draft',
        author_id bigint(20) unsigned NOT NULL DEFAULT 0,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY status (status),
        KEY author_id (author_id)
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
}

register_activation_hook(__FILE__, 'myplugin_create_tables');
```

## Content Migration

```bash
# Export/import content
wp export --post_type=post --start_date=2024-01-01 --filename_format=posts-2024.xml
wp import posts-2024.xml --authors=mapping.csv

# Bulk update post status
wp post list --post_type=page --post_status=draft --format=ids | xargs -d ' ' -I {} wp post update {} --post_status=publish

# Migrate post type
wp post list --post_type=post --format=ids | xargs -I {} wp post update {} --post_type=article

# Reassign author
wp post list --post_type=post --author=2 --format=ids | xargs -I {} wp post update {} --post_author=5

# Generate test content
wp post generate --count=50 --post_type=post --post_status=publish
wp user generate --count=10 --role=subscriber
wp term generate category --count=20
```

## Environment Configuration

```php
// wp-config.php — environment detection
$env = getenv('WP_ENV') ?: 'production';

switch ($env) {
    case 'development':
        define('WP_DEBUG', true);
        define('WP_DEBUG_LOG', true);
        define('WP_DEBUG_DISPLAY', true);
        define('SCRIPT_DEBUG', true);
        define('SAVEQUERIES', true);
        define('WP_ENVIRONMENT_TYPE', 'development');
        break;

    case 'staging':
        define('WP_DEBUG', true);
        define('WP_DEBUG_LOG', true);
        define('WP_DEBUG_DISPLAY', false);
        define('WP_ENVIRONMENT_TYPE', 'staging');
        define('DISALLOW_FILE_MODS', true);
        break;

    case 'production':
    default:
        define('WP_DEBUG', false);
        define('WP_ENVIRONMENT_TYPE', 'production');
        define('DISALLOW_FILE_EDIT', true);
        define('DISALLOW_FILE_MODS', true);  // no plugin/theme installs
        break;
}

// Check environment in code
if (wp_get_environment_type() === 'development') {
    // dev-only features
}
```

## Deployment Checklist (CLI)

```bash
# Pre-deployment
wp core verify-checksums                  # verify core file integrity
wp plugin verify-checksums --all          # verify plugin integrity
wp db export pre-deploy-$(date +%s).sql   # backup database

# Deploy
git pull origin main                      # pull latest code
composer install --no-dev --optimize-autoloader  # if using Composer
npm run build                             # if using build tools

# Post-deployment
wp cache flush                            # clear object cache
wp rewrite flush                          # regenerate .htaccess / rewrite rules
wp cron event run --due-now               # run pending cron
wp transient delete --all                 # clear transients

# Verify
wp core version                           # check WP version
wp plugin list --status=active            # verify active plugins
wp theme status                           # verify active theme
wp option get siteurl                     # verify URLs
wp option get home
```

## Composer-Based WordPress (Bedrock)

```
project/
├── config/
│   ├── application.php    # Main config (replaces wp-config.php)
│   └── environments/
│       ├── development.php
│       ├── staging.php
│       └── production.php
├── web/
│   ├── app/               # wp-content equivalent
│   │   ├── mu-plugins/
│   │   ├── plugins/
│   │   ├── themes/
│   │   └── uploads/
│   ├── wp/                # WordPress core (Composer-managed)
│   └── index.php
├── composer.json
├── .env                   # Environment variables
└── .env.example
```

```json
// composer.json (key parts)
{
    "require": {
        "roots/bedrock-autoloader": "^1.0",
        "roots/wordpress": "^6.7",
        "wpackagist-plugin/woocommerce": "^9.0",
        "wpackagist-plugin/advanced-custom-fields": "^6.0"
    },
    "repositories": [
        { "type": "composer", "url": "https://wpackagist.org" }
    ],
    "extra": {
        "installer-paths": {
            "web/app/mu-plugins/{$name}/": ["type:wordpress-muplugin"],
            "web/app/plugins/{$name}/":    ["type:wordpress-plugin"],
            "web/app/themes/{$name}/":     ["type:wordpress-theme"]
        },
        "wordpress-install-dir": "web/wp"
    }
}
```

## Safe Migration Script

```php
// Safe one-time migration via WP-CLI
// Run: wp eval-file migrate-data.php

<?php
if (!defined('WP_CLI')) {
    die('This script must be run via WP-CLI');
}

WP_CLI::log('Starting migration...');

global $wpdb;
$batch_size = 100;
$offset = 0;
$migrated = 0;

do {
    $posts = $wpdb->get_results($wpdb->prepare(
        "SELECT ID, meta_value FROM {$wpdb->posts} p
         JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
         WHERE p.post_type = %s AND pm.meta_key = %s
         LIMIT %d OFFSET %d",
        'product', '_old_price_format', $batch_size, $offset
    ));

    foreach ($posts as $post) {
        $new_value = myplugin_convert_price($post->meta_value);
        update_post_meta($post->ID, '_price', $new_value);
        delete_post_meta($post->ID, '_old_price_format');
        $migrated++;
    }

    $offset += $batch_size;
    WP_CLI::log("Migrated $migrated posts...");

} while (count($posts) === $batch_size);

WP_CLI::success("Migration complete. $migrated posts updated.");
```

## Best Practices

1. **Always backup before migration** — `wp db export` before any data change
2. **Use `--dry-run`** — for `search-replace` to preview changes first
3. **Version your schema** — track `myplugin_db_version` option for incremental migrations
4. **Use `dbDelta()`** — for table creation/updates (handles CREATE + ALTER)
5. **Environment detection** — `wp_get_environment_type()` for env-specific behavior
6. **Disable file mods in production** — `DISALLOW_FILE_MODS` prevents plugin installs
7. **Use Composer** — for dependency management (Bedrock pattern)
8. **Batch large migrations** — process in chunks to avoid timeouts
9. **Flush caches after deploy** — `wp cache flush && wp rewrite flush`
10. **Test migrations on staging** — never run untested migrations on production

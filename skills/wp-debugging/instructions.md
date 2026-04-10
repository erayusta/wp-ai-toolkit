# WordPress Debugging & Troubleshooting — Agent Skill

You are an expert in WordPress debugging, error diagnosis, performance profiling, and troubleshooting common issues.

## Debug Constants (wp-config.php)

```php
// Development — show all errors
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);           // Write to wp-content/debug.log
define('WP_DEBUG_DISPLAY', true);       // Show on screen
define('SCRIPT_DEBUG', true);           // Use unminified CSS/JS
define('SAVEQUERIES', true);            // Log all DB queries in $wpdb->queries

// Production — log only, don't display
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
@ini_set('display_errors', 0);

// Custom log path
define('WP_DEBUG_LOG', '/path/to/custom/debug.log');
```

## Reading Debug Log

```bash
# View last 50 errors
tail -50 wp-content/debug.log

# Watch live (great for debugging)
tail -f wp-content/debug.log

# Search for specific errors
grep -i "fatal" wp-content/debug.log
grep -i "warning" wp-content/debug.log | tail -20

# WP-CLI
wp eval 'readfile(ABSPATH . "wp-content/debug.log");' 2>/dev/null | tail -50

# Clear debug log
: > wp-content/debug.log
```

## Common Errors & Solutions

| Error | Cause | Fix |
|:------|:------|:----|
| **White Screen of Death (WSOD)** | PHP fatal error | Enable WP_DEBUG, check debug.log |
| **500 Internal Server Error** | PHP error or .htaccess issue | Check error_log, rename .htaccess |
| **Memory exhausted** | `Allowed memory size exhausted` | `define('WP_MEMORY_LIMIT', '256M');` |
| **Maximum execution time** | Plugin timeout | `set_time_limit(300)` or optimize code |
| **Headers already sent** | Output before headers | Remove BOM, whitespace before `<?php`, closing `?>` |
| **Cannot modify header** | Same as above | Check functions.php for whitespace |
| **"Are you sure?"** | Nonce failure | Check nonce field names, expiry |
| **Maintenance mode stuck** | Failed update | Delete `.maintenance` from root |
| **Parse error: syntax error** | PHP syntax | Check the file and line number |
| **"Briefly unavailable"** | Update in progress | Delete `.maintenance` file |
| **Database connection error** | Wrong DB credentials | Check `wp-config.php` DB_NAME, DB_USER, DB_PASSWORD, DB_HOST |

## Plugin Conflict Detection

```bash
# Deactivate all plugins
wp plugin deactivate --all

# Activate one by one to find the conflict
wp plugin activate plugin-name

# Or check with WP-CLI
wp plugin list --status=active --format=table

# Check for PHP errors after each activation
tail -5 wp-content/debug.log
```

```php
// Programmatic conflict detection
add_action('admin_init', function () {
    if (!isset($_GET['debug_plugins']) || !current_user_can('manage_options')) return;

    $active = get_option('active_plugins');
    $conflicts = [];

    foreach ($active as $plugin) {
        // Try loading each plugin in isolation
        deactivate_plugins($plugin);
        // Check if problem persists...
        activate_plugin($plugin);
    }
});
```

## Query Monitor Plugin

```bash
wp plugin install query-monitor --activate
```

**What it shows:**
- Database queries (slow queries highlighted)
- PHP errors and warnings
- HTTP API calls
- Hooks fired and their callbacks
- Enqueued scripts and styles
- Conditional checks (is_single, is_admin, etc.)
- Environment info (PHP version, MySQL, memory)

## Custom Debug Logging

```php
// Write to debug.log (always available)
error_log('My debug message');
error_log(print_r($array_data, true));

// Structured logging function
function myplugin_log($message, $data = null) {
    if (!defined('WP_DEBUG') || !WP_DEBUG) return;

    $entry = '[' . date('Y-m-d H:i:s') . '] [myplugin] ' . $message;
    if ($data !== null) {
        $entry .= ' | ' . (is_string($data) ? $data : wp_json_encode($data));
    }
    error_log($entry);
}

// Usage
myplugin_log('Processing order', ['order_id' => 123, 'status' => 'pending']);
```

## Database Query Debugging

```php
// Enable SAVEQUERIES in wp-config.php first
define('SAVEQUERIES', true);

// Then inspect queries
add_action('shutdown', function () {
    if (!current_user_can('manage_options')) return;

    global $wpdb;
    $slow = array_filter($wpdb->queries, function ($q) {
        return $q[1] > 0.05; // queries taking > 50ms
    });

    if (!empty($slow)) {
        error_log('=== SLOW QUERIES ===');
        foreach ($slow as $q) {
            error_log(sprintf('%.4fs: %s [called from: %s]', $q[1], $q[0], $q[2]));
        }
    }

    error_log(sprintf('Total queries: %d | Total time: %.4fs',
        count($wpdb->queries),
        array_sum(array_column($wpdb->queries, 1))
    ));
});
```

## WP-CLI Debugging

```bash
# Check WordPress health
wp core verify-checksums        # Verify core files integrity
wp plugin verify-checksums --all # Verify plugin files

# Check for errors
wp eval 'error_reporting(E_ALL); phpinfo();' 2>&1 | grep -i error

# Check PHP version and modules
wp eval 'echo phpversion();'
wp eval 'echo implode(", ", get_loaded_extensions());'

# Check database
wp db check
wp db repair
wp db optimize

# Check cron
wp cron event list
wp cron test

# Check options table for large entries
wp db query "SELECT option_name, LENGTH(option_value) AS size FROM $(wp db prefix)options WHERE autoload='yes' ORDER BY size DESC LIMIT 20"

# Check rewrite rules
wp rewrite list
wp rewrite flush
```

## Performance Profiling

```php
// Simple timer
$start = microtime(true);
// ... code to profile ...
$elapsed = microtime(true) - $start;
error_log(sprintf('Operation took %.4f seconds', $elapsed));

// Memory usage
error_log(sprintf('Memory: %s / Peak: %s',
    size_format(memory_get_usage()),
    size_format(memory_get_peak_usage())
));
```

## REST API Debugging

```php
// Log REST API requests
add_filter('rest_pre_dispatch', function ($result, $server, $request) {
    error_log(sprintf('REST: %s %s', $request->get_method(), $request->get_route()));
    return $result;
}, 10, 3);

// Return debug info in REST responses
add_filter('rest_post_dispatch', function ($response) {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        global $wpdb;
        $response->header('X-WP-Query-Count', count($wpdb->queries ?? []));
        $response->header('X-WP-Memory', size_format(memory_get_peak_usage()));
    }
    return $response;
});
```

## Best Practices

1. **Never enable WP_DEBUG_DISPLAY on production** — use WP_DEBUG_LOG only
2. **Install Query Monitor** — the best debugging tool for WordPress
3. **Check debug.log first** — most errors are logged there
4. **Disable plugins to isolate** — WP-CLI makes this fast
5. **Use structured logging** — prefix, timestamp, context data
6. **Check .htaccess** — rename to test if it's causing 500 errors
7. **Verify file permissions** — 644 for files, 755 for directories
8. **Check PHP memory limit** — both wp-config.php and php.ini
9. **Use `wp db check`** — corrupted tables cause mysterious errors
10. **Profile before optimizing** — measure first, don't guess where the bottleneck is

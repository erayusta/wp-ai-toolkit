# WordPress Cron & Background Processing — Agent Skill

You are an expert in WordPress scheduled tasks, WP-Cron, Action Scheduler, and background processing.

## WP-Cron Basics

```php
// Register custom schedule interval
add_filter('cron_schedules', function ($schedules) {
    $schedules['every_five_minutes'] = [
        'interval' => 5 * MINUTE_IN_SECONDS,
        'display'  => __('Every 5 Minutes', 'my-plugin'),
    ];
    $schedules['twice_daily_morning'] = [
        'interval' => 12 * HOUR_IN_SECONDS,
        'display'  => __('Twice Daily', 'my-plugin'),
    ];
    return $schedules;
});

// Schedule an event on plugin activation
register_activation_hook(__FILE__, function () {
    if (!wp_next_scheduled('myplugin_daily_cleanup')) {
        wp_schedule_event(time(), 'daily', 'myplugin_daily_cleanup');
    }
});

// Handle the scheduled event
add_action('myplugin_daily_cleanup', function () {
    // Clean expired data, send reports, sync external API, etc.
    myplugin_delete_expired_records();
    myplugin_send_daily_report();
});

// Unschedule on deactivation
register_deactivation_hook(__FILE__, function () {
    wp_clear_scheduled_hook('myplugin_daily_cleanup');
});
```

## Built-in Schedules

| Schedule | Interval |
|----------|----------|
| `hourly` | 1 hour |
| `twicedaily` | 12 hours |
| `daily` | 24 hours |
| `weekly` | 7 days |

## Single (One-Time) Events

```php
// Schedule a one-time event (e.g., send email in 1 hour)
wp_schedule_single_event(time() + HOUR_IN_SECONDS, 'myplugin_send_reminder', [$user_id, $message]);

add_action('myplugin_send_reminder', function ($user_id, $message) {
    $user = get_userdata($user_id);
    if ($user) {
        wp_mail($user->user_email, 'Reminder', $message);
    }
}, 10, 2);
```

## WP-Cron Management

```php
// Check if event is scheduled
$next = wp_next_scheduled('myplugin_daily_cleanup');
if ($next) {
    echo 'Next run: ' . wp_date('Y-m-d H:i:s', $next);
}

// Unschedule specific event
$timestamp = wp_next_scheduled('myplugin_daily_cleanup');
if ($timestamp) {
    wp_unschedule_event($timestamp, 'myplugin_daily_cleanup');
}

// Clear ALL instances of a hook
wp_clear_scheduled_hook('myplugin_daily_cleanup');

// List all scheduled events (debugging)
$crons = _get_cron_array();
foreach ($crons as $timestamp => $hooks) {
    foreach ($hooks as $hook => $events) {
        error_log("$hook scheduled at " . wp_date('Y-m-d H:i', $timestamp));
    }
}
```

## System Cron (Production)

```php
// wp-config.php — disable WP pseudo-cron
define('DISABLE_WP_CRON', true);
```

```bash
# System crontab — run WP-Cron every 5 minutes
*/5 * * * * cd /var/www/html && wp cron event run --due-now --quiet

# Or via HTTP
*/5 * * * * curl -s https://example.com/wp-cron.php?doing_wp_cron > /dev/null 2>&1

# WP-CLI cron commands
wp cron event list                    # list all scheduled events
wp cron event run myplugin_cleanup    # manually trigger
wp cron event delete myplugin_cleanup # remove
wp cron schedule list                 # list available intervals
wp cron test                          # test if cron is working
```

## Action Scheduler (Recommended for Heavy Tasks)

Action Scheduler is included with WooCommerce and can be installed standalone. It's superior to WP-Cron for reliable background processing.

```php
// Schedule recurring action
if (function_exists('as_schedule_recurring_action')) {
    if (!as_has_scheduled_action('myplugin_sync_products')) {
        as_schedule_recurring_action(time(), HOUR_IN_SECONDS, 'myplugin_sync_products');
    }
}

// Schedule one-time action
as_schedule_single_action(time() + 300, 'myplugin_process_order', [$order_id]);

// Schedule async (run ASAP in background)
as_enqueue_async_action('myplugin_send_notification', [$user_id, $message]);

// Handle the action
add_action('myplugin_sync_products', function () {
    $products = myplugin_fetch_external_products();
    foreach ($products as $product) {
        myplugin_import_product($product);
    }
});

// Batch processing with Action Scheduler
add_action('myplugin_batch_import', function ($offset) {
    $batch_size = 50;
    $items = myplugin_get_items($offset, $batch_size);

    foreach ($items as $item) {
        myplugin_process_item($item);
    }

    // Schedule next batch if more items exist
    if (count($items) === $batch_size) {
        as_schedule_single_action(time(), 'myplugin_batch_import', [$offset + $batch_size]);
    }
});

// Start batch processing
as_enqueue_async_action('myplugin_batch_import', [0]);

// Unschedule
as_unschedule_all_actions('myplugin_sync_products');
```

### Action Scheduler vs WP-Cron

| Feature | WP-Cron | Action Scheduler |
|---------|---------|-----------------|
| Reliability | Depends on site traffic | DB-backed queue, reliable |
| Logging | None | Full execution history |
| Retry on failure | No | Yes, with backoff |
| Concurrent execution | No protection | Claim-based locking |
| Large batches | Can timeout | Handles gracefully |
| UI | None (need plugin) | WooCommerce > Status > Scheduled Actions |
| Async actions | No | Yes (`as_enqueue_async_action`) |

## Background Processing with wp_remote_post

```php
// Fire-and-forget background task
function myplugin_dispatch_background_task($data) {
    wp_remote_post(admin_url('admin-ajax.php'), [
        'timeout'   => 0.01,  // Don't wait for response
        'blocking'  => false,
        'sslverify' => false,
        'body'      => [
            'action' => 'myplugin_background_task',
            'nonce'  => wp_create_nonce('myplugin_bg_task'),
            'data'   => wp_json_encode($data),
        ],
    ]);
}

add_action('wp_ajax_nopriv_myplugin_background_task', 'myplugin_handle_bg_task');
add_action('wp_ajax_myplugin_background_task', 'myplugin_handle_bg_task');

function myplugin_handle_bg_task() {
    check_ajax_referer('myplugin_bg_task', 'nonce');

    // Increase limits for background work
    ignore_user_abort(true);
    set_time_limit(300);

    $data = json_decode(wp_unslash($_POST['data'] ?? '{}'), true);
    myplugin_process($data);

    wp_die();
}
```

## Transient-Based Locking

```php
// Prevent concurrent execution
function myplugin_run_sync() {
    $lock = get_transient('myplugin_sync_lock');
    if ($lock) return; // Another process is running

    set_transient('myplugin_sync_lock', true, 5 * MINUTE_IN_SECONDS);

    try {
        myplugin_do_sync();
    } finally {
        delete_transient('myplugin_sync_lock');
    }
}
```

## Best Practices

1. **Use Action Scheduler** — for anything beyond simple recurring tasks
2. **Always unschedule on deactivation** — `wp_clear_scheduled_hook()` or `as_unschedule_all_actions()`
3. **Use system cron in production** — `DISABLE_WP_CRON` + real crontab
4. **Implement locking** — prevent duplicate concurrent execution
5. **Batch large operations** — process 50-100 items per run, schedule next batch
6. **Set time limits** — `set_time_limit(300)` for long background tasks
7. **Log failures** — use `error_log()` or WC Logger for debugging
8. **Check `wp_next_scheduled()`** — before scheduling to avoid duplicates
9. **Use `as_enqueue_async_action()`** — for fire-and-forget tasks
10. **Monitor with WP-CLI** — `wp cron event list` and `wp action-scheduler run`

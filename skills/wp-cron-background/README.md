# WP Cron & Background Processing

> Manage WP-Cron, Action Scheduler, and background processing tasks

## What This Skill Covers

- Scheduling single and recurring events with WP-Cron
- Replacing WP-Cron with system cron for reliability
- Using Action Scheduler for scalable background job queues
- Implementing background processing for large data operations

## Example Usage

Ask your AI assistant:

```
> "Set up Action Scheduler to process 10,000 email sends in batches on wordpress.test"
```

### Example Output

```php
// Schedule the batch processing job
function schedule_bulk_email_send( array $email_ids ) {
    $batches = array_chunk( $email_ids, 50 );

    foreach ( $batches as $index => $batch ) {
        as_schedule_single_action(
            time() + ( $index * 60 ), // Stagger by 1 minute
            'process_email_batch',
            array( 'email_ids' => $batch ),
            'bulk-email'
        );
    }
}

// Process each batch
add_action( 'process_email_batch', 'handle_email_batch' );

function handle_email_batch( array $email_ids ) {
    foreach ( $email_ids as $email_id ) {
        $email = get_post( $email_id );
        if ( ! $email ) {
            continue;
        }

        $sent = wp_mail(
            get_post_meta( $email_id, '_recipient', true ),
            $email->post_title,
            $email->post_content
        );

        update_post_meta( $email_id, '_sent', $sent ? 'yes' : 'failed' );
    }
}

// Monitor progress
function get_email_send_progress() {
    $pending = as_get_scheduled_actions( array(
        'hook'   => 'process_email_batch',
        'status' => ActionScheduler_Store::STATUS_PENDING,
    ), 'ARRAY_A' );

    return count( $pending );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `run_wp_cli` | Lists and manages scheduled cron events |
| `analyze_database` | Checks Action Scheduler tables and pending jobs |
| `validate_php` | Verifies cron callback registration |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

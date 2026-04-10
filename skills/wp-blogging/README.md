# WP Blogging

> Manage posts, editorial workflows, RSS feeds, and comment systems

## What This Skill Covers

- Creating and scheduling posts with custom statuses and workflows
- Configuring RSS feed settings, excerpts, and custom feeds
- Managing comment moderation, threading, and spam prevention
- Building editorial calendars and multi-author workflows

## Example Usage

Ask your AI assistant:

```
> "Set up a custom editorial workflow with draft review stages on wordpress.test"
```

### Example Output

```php
// Register custom post statuses for editorial workflow
add_action( 'init', 'register_editorial_statuses' );

function register_editorial_statuses() {
    register_post_status( 'pitch', array(
        'label'                     => _x( 'Pitch', 'post status', 'myplugin' ),
        'public'                    => false,
        'exclude_from_search'       => true,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop( 'Pitch <span class="count">(%s)</span>', 'Pitches <span class="count">(%s)</span>', 'myplugin' ),
    ) );

    register_post_status( 'in_review', array(
        'label'                     => _x( 'In Review', 'post status', 'myplugin' ),
        'public'                    => false,
        'exclude_from_search'       => true,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop( 'In Review <span class="count">(%s)</span>', 'In Review <span class="count">(%s)</span>', 'myplugin' ),
    ) );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `run_wp_cli` | Creates and manages posts via WP-CLI |
| `analyze_content` | Reviews post structure and readability |
| `validate_php` | Checks custom status registration code |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

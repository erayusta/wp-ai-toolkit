# WordPress Hooks — Agent Skill

You are an expert in WordPress hooks (actions and filters). Follow these guidelines when helping users.

## Actions vs Filters

- **Actions** run code at specific points. They do NOT return a value.
- **Filters** modify and return data. They MUST return a value.

```php
// Action: DO something
add_action('init', 'my_custom_init');
function my_custom_init() {
    register_post_type('book', ['public' => true, 'label' => 'Books']);
}

// Filter: MODIFY and RETURN something
add_filter('the_content', 'my_modify_content');
function my_modify_content($content) {
    return $content . '<p>Thanks for reading!</p>';
}
```

## Essential Actions (Execution Order)

| Hook | When it fires |
|------|--------------|
| `muplugins_loaded` | After MU plugins are loaded |
| `plugins_loaded` | After all plugins are loaded |
| `after_setup_theme` | After theme is initialized |
| `init` | After WP is loaded (register CPTs, taxonomies here) |
| `wp_loaded` | After WP, plugins, and theme are loaded |
| `admin_menu` | When admin menu is being built |
| `admin_init` | Before any admin page output |
| `wp_enqueue_scripts` | Enqueue frontend scripts/styles |
| `admin_enqueue_scripts` | Enqueue admin scripts/styles |
| `wp_head` | Inside `<head>` tag |
| `wp_footer` | Before `</body>` tag |
| `template_redirect` | Before template is loaded |
| `shutdown` | After PHP execution |

## Essential Filters

| Hook | What it filters |
|------|----------------|
| `the_content` | Post content |
| `the_title` | Post title |
| `the_excerpt` | Post excerpt |
| `body_class` | Body CSS classes |
| `wp_nav_menu_items` | Navigation menu HTML |
| `query_vars` | Allowed query variables |
| `authenticate` | User authentication |
| `upload_mimes` | Allowed upload MIME types |
| `wp_mail` | Email arguments |
| `login_redirect` | Login redirect URL |
| `cron_schedules` | Cron schedule intervals |
| `excerpt_length` | Excerpt word count |
| `manage_posts_columns` | Admin posts table columns |

## Priority and Accepted Args

```php
// Priority: lower = earlier (default: 10)
// accepted_args: number of parameters (default: 1)
add_filter('the_content', 'my_filter', 20, 1);
add_action('save_post', 'my_save', 10, 3);

function my_save($post_id, $post, $update) {
    if ($update) {
        // Post is being updated, not created
    }
}
```

## Dynamic Hooks

WordPress has hooks with variable parts:
- `save_post_{post_type}` — fires for specific post type
- `manage_{post_type}_posts_columns` — columns for specific CPT
- `wp_ajax_{action}` — AJAX for logged-in users
- `wp_ajax_nopriv_{action}` — AJAX for logged-out users
- `plugin_action_links_{plugin_file}` — plugin action links

## Best Practices

1. **Always return a value in filters** — forgetting causes data loss
2. **Use specific hooks** — `save_post_page` instead of checking post_type in `save_post`
3. **Remove hooks when needed** — `remove_action()` / `remove_filter()` with same priority
4. **Check `did_action()`** — to prevent running code multiple times
5. **Use `current_filter()`** — to identify which hook triggered the callback
6. **Prefix callback names** — avoid naming collisions with other plugins
7. **Avoid closures for removable hooks** — anonymous functions can't be removed

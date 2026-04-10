# WP Admin UI

> Build custom admin pages, meta boxes, list tables, and dashboard widgets

## What This Skill Covers

- Registering admin menu pages and subpages with proper capabilities
- Creating custom meta boxes for post edit screens
- Building sortable, filterable WP_List_Table implementations
- Adding dashboard widgets with configurable options

## Example Usage

Ask your AI assistant:

```
> "Create a custom admin settings page with tabs for my plugin on wordpress.test"
```

### Example Output

```php
add_action( 'admin_menu', 'myplugin_add_settings_page' );

function myplugin_add_settings_page() {
    add_menu_page(
        __( 'My Plugin Settings', 'myplugin' ),
        __( 'My Plugin', 'myplugin' ),
        'manage_options',
        'myplugin-settings',
        'myplugin_render_settings_page',
        'dashicons-admin-generic',
        80
    );
}

function myplugin_render_settings_page() {
    $active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'general';
    ?>
    <div class="wrap">
        <h1><?php esc_html_e( 'My Plugin Settings', 'myplugin' ); ?></h1>
        <nav class="nav-tab-wrapper">
            <a href="?page=myplugin-settings&tab=general"
               class="nav-tab <?php echo $active_tab === 'general' ? 'nav-tab-active' : ''; ?>">
                <?php esc_html_e( 'General', 'myplugin' ); ?>
            </a>
            <a href="?page=myplugin-settings&tab=advanced"
               class="nav-tab <?php echo $active_tab === 'advanced' ? 'nav-tab-active' : ''; ?>">
                <?php esc_html_e( 'Advanced', 'myplugin' ); ?>
            </a>
        </nav>
        <div class="tab-content">
            <?php do_settings_sections( 'myplugin-' . $active_tab ); ?>
        </div>
    </div>
    <?php
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `scaffold_component` | Generates admin page and meta box boilerplate |
| `validate_php` | Checks PHP syntax and WordPress coding standards |
| `analyze_permissions` | Verifies capability checks on admin pages |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*

# WordPress Admin UI — Agent Skill

You are an expert in building WordPress admin interfaces: settings pages, meta boxes, list tables, admin columns, dashboard widgets, and admin notices.

## Admin Menu & Pages

```php
add_action('admin_menu', function () {
    // Top-level menu
    add_menu_page(
        __('My Plugin', 'my-plugin'),     // Page title
        __('My Plugin', 'my-plugin'),     // Menu title
        'manage_options',                  // Capability
        'myplugin',                        // Slug
        'myplugin_admin_page',            // Callback
        'dashicons-admin-generic',        // Icon (dashicons-*)
        80                                 // Position
    );

    // Submenu pages
    add_submenu_page('myplugin', __('Settings', 'my-plugin'), __('Settings', 'my-plugin'),
        'manage_options', 'myplugin-settings', 'myplugin_settings_page');
    add_submenu_page('myplugin', __('Reports', 'my-plugin'), __('Reports', 'my-plugin'),
        'manage_options', 'myplugin-reports', 'myplugin_reports_page');

    // Under existing menus
    add_options_page(__('My Plugin', 'my-plugin'), __('My Plugin', 'my-plugin'),
        'manage_options', 'myplugin-options', 'myplugin_options_page');
    add_management_page(__('My Tool', 'my-plugin'), __('My Tool', 'my-plugin'),
        'manage_options', 'myplugin-tool', 'myplugin_tool_page');
});
```

## Settings Page with Tabs

```php
function myplugin_settings_page() {
    if (!current_user_can('manage_options')) return;

    $active_tab = sanitize_key($_GET['tab'] ?? 'general');
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

        <nav class="nav-tab-wrapper">
            <a href="?page=myplugin-settings&tab=general"
               class="nav-tab <?php echo $active_tab === 'general' ? 'nav-tab-active' : ''; ?>">
                <?php esc_html_e('General', 'my-plugin'); ?>
            </a>
            <a href="?page=myplugin-settings&tab=advanced"
               class="nav-tab <?php echo $active_tab === 'advanced' ? 'nav-tab-active' : ''; ?>">
                <?php esc_html_e('Advanced', 'my-plugin'); ?>
            </a>
        </nav>

        <form action="options.php" method="post">
            <?php
            if ($active_tab === 'general') {
                settings_fields('myplugin_general');
                do_settings_sections('myplugin-general');
            } else {
                settings_fields('myplugin_advanced');
                do_settings_sections('myplugin-advanced');
            }
            submit_button();
            ?>
        </form>
    </div>
    <?php
}
```

## Custom Meta Boxes

```php
add_action('add_meta_boxes', function () {
    add_meta_box('myplugin_sidebar_box', __('Quick Info', 'my-plugin'),
        'myplugin_sidebar_box_render', 'post', 'side', 'high');
    add_meta_box('myplugin_main_box', __('Extra Details', 'my-plugin'),
        'myplugin_main_box_render', ['post', 'page'], 'normal', 'default');
});

function myplugin_sidebar_box_render($post) {
    wp_nonce_field('myplugin_meta_save', 'myplugin_meta_nonce');
    $status = get_post_meta($post->ID, '_myplugin_status', true);
    ?>
    <p>
        <label for="myplugin_status"><?php esc_html_e('Status', 'my-plugin'); ?></label>
        <select id="myplugin_status" name="myplugin_status" class="widefat">
            <option value="draft" <?php selected($status, 'draft'); ?>>Draft</option>
            <option value="review" <?php selected($status, 'review'); ?>>Review</option>
            <option value="approved" <?php selected($status, 'approved'); ?>>Approved</option>
        </select>
    </p>
    <?php
}
```

## Custom Admin Columns

```php
// Add column header
add_filter('manage_post_posts_columns', function ($columns) {
    $new = [];
    foreach ($columns as $key => $label) {
        $new[$key] = $label;
        if ($key === 'title') {
            $new['myplugin_status'] = __('Status', 'my-plugin');
            $new['myplugin_views']  = __('Views', 'my-plugin');
        }
    }
    return $new;
});

// Render column content
add_action('manage_post_posts_custom_column', function ($column, $post_id) {
    switch ($column) {
        case 'myplugin_status':
            $status = get_post_meta($post_id, '_myplugin_status', true);
            $colors = ['draft' => '#999', 'review' => '#f0ad4e', 'approved' => '#5cb85c'];
            printf('<span style="color:%s">%s</span>',
                esc_attr($colors[$status] ?? '#999'), esc_html(ucfirst($status ?: 'None')));
            break;
        case 'myplugin_views':
            echo absint(get_post_meta($post_id, '_myplugin_views', true));
            break;
    }
}, 10, 2);

// Make column sortable
add_filter('manage_edit-post_sortable_columns', function ($columns) {
    $columns['myplugin_views'] = 'myplugin_views';
    return $columns;
});

add_action('pre_get_posts', function ($query) {
    if (!is_admin() || !$query->is_main_query()) return;
    if ($query->get('orderby') === 'myplugin_views') {
        $query->set('meta_key', '_myplugin_views');
        $query->set('orderby', 'meta_value_num');
    }
});
```

## Dashboard Widgets

```php
add_action('wp_dashboard_setup', function () {
    wp_add_dashboard_widget(
        'myplugin_dashboard',
        __('My Plugin Stats', 'my-plugin'),
        function () {
            $total   = wp_count_posts('product')->publish;
            $pending = wp_count_posts('product')->pending;
            ?>
            <ul>
                <li><strong><?php echo absint($total); ?></strong> <?php esc_html_e('Published Products', 'my-plugin'); ?></li>
                <li><strong><?php echo absint($pending); ?></strong> <?php esc_html_e('Pending Review', 'my-plugin'); ?></li>
            </ul>
            <p><a href="<?php echo esc_url(admin_url('edit.php?post_type=product')); ?>" class="button">
                <?php esc_html_e('View All', 'my-plugin'); ?>
            </a></p>
            <?php
        }
    );
});
```

## Admin Notices

```php
// One-time notice (with dismiss)
add_action('admin_notices', function () {
    if (get_option('myplugin_activation_notice_dismissed')) return;
    ?>
    <div class="notice notice-info is-dismissible" data-myplugin-dismiss="activation">
        <p><?php esc_html_e('My Plugin is active! Configure it in Settings.', 'my-plugin'); ?>
           <a href="<?php echo esc_url(admin_url('options-general.php?page=myplugin')); ?>">
               <?php esc_html_e('Go to Settings', 'my-plugin'); ?>
           </a>
        </p>
    </div>
    <?php
});

// Error notice
add_action('admin_notices', function () {
    $screen = get_current_screen();
    if ($screen->id !== 'myplugin-settings') return;
    if (empty(get_option('myplugin_api_key'))) {
        echo '<div class="notice notice-error"><p>' .
            esc_html__('API key is required for My Plugin to work.', 'my-plugin') .
            '</p></div>';
    }
});

// Notice types: notice-info, notice-success, notice-warning, notice-error
```

## Custom List Table (WP_List_Table)

```php
if (!class_exists('WP_List_Table')) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class MyPlugin_Log_Table extends WP_List_Table {
    public function get_columns() {
        return [
            'cb'      => '<input type="checkbox" />',
            'date'    => __('Date', 'my-plugin'),
            'action'  => __('Action', 'my-plugin'),
            'user'    => __('User', 'my-plugin'),
            'details' => __('Details', 'my-plugin'),
        ];
    }

    public function prepare_items() {
        $per_page = 20;
        $current  = $this->get_pagenum();
        $this->_column_headers = [$this->get_columns(), [], $this->get_sortable_columns()];
        $this->items = myplugin_get_logs($per_page, $current);
        $total = myplugin_count_logs();
        $this->set_pagination_args(['total_items' => $total, 'per_page' => $per_page]);
    }

    protected function column_default($item, $column_name) {
        return esc_html($item[$column_name] ?? '');
    }

    protected function column_cb($item) {
        return sprintf('<input type="checkbox" name="log_ids[]" value="%d" />', absint($item['id']));
    }

    protected function column_date($item) {
        return esc_html(wp_date('Y-m-d H:i', strtotime($item['date'])));
    }

    protected function get_sortable_columns() {
        return ['date' => ['date', true], 'action' => ['action', false]];
    }

    protected function get_bulk_actions() {
        return ['delete' => __('Delete', 'my-plugin')];
    }
}
```

## Admin Enqueue (Conditional)

```php
add_action('admin_enqueue_scripts', function ($hook) {
    // Only on our plugin pages
    if (!str_starts_with($hook, 'toplevel_page_myplugin') && $hook !== 'settings_page_myplugin') {
        return;
    }

    wp_enqueue_style('myplugin-admin', plugin_dir_url(__FILE__) . 'css/admin.css', [], '1.0.0');
    wp_enqueue_script('myplugin-admin', plugin_dir_url(__FILE__) . 'js/admin.js', ['jquery'], '1.0.0', true);
    wp_localize_script('myplugin-admin', 'myPluginAdmin', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('myplugin_admin_nonce'),
    ]);
});
```

## Screen Options

```php
add_action('admin_menu', function () {
    $hook = add_menu_page('My Plugin', 'My Plugin', 'manage_options', 'myplugin-logs', 'myplugin_logs_page');
    add_action("load-$hook", function () {
        add_screen_option('per_page', [
            'label'   => __('Logs per page', 'my-plugin'),
            'default' => 20,
            'option'  => 'myplugin_logs_per_page',
        ]);
    });
});

add_filter('set-screen-option', function ($status, $option, $value) {
    if ($option === 'myplugin_logs_per_page') return absint($value);
    return $status;
}, 10, 3);
```

## Best Practices

1. **Check capabilities** — `current_user_can()` at the top of every page callback
2. **Use WordPress CSS classes** — `wrap`, `nav-tab-wrapper`, `widefat`, `form-table`
3. **Conditional enqueue** — only load assets on your plugin's admin pages
4. **Nonce all forms** — `wp_nonce_field()` + `check_admin_referer()`
5. **Use Settings API** — for options pages instead of custom form handlers
6. **Escape all output** — even admin-only pages need proper escaping
7. **Add screen options** — for list tables with pagination
8. **Use admin notices** — for feedback, not custom HTML alerts
9. **Follow WordPress UI patterns** — admin looks consistent, users know how to navigate
10. **Extend WP_List_Table** — for data listing instead of custom HTML tables

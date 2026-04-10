/**
 * Tool: scaffold_component
 *
 * Generates boilerplate code for WordPress components:
 * plugins, themes, blocks, custom post types, taxonomies,
 * REST endpoints, widgets, shortcodes, and Elementor widgets.
 */

import { z } from "zod";
import { successResponse, errorResponse, type ToolResponse } from "../types.js";
import { requireConversation } from "../utils/conversation.js";
import { logger } from "../utils/logger.js";

export const scaffoldComponentSchema = z.object({
  type: z
    .enum([
      "plugin", "theme", "block", "custom-post-type", "taxonomy",
      "rest-endpoint", "widget", "shortcode", "elementor-widget",
      "meta-box", "settings-page", "cron-job", "ajax-handler",
    ])
    .describe("The type of WordPress component to scaffold."),
  name: z.string().describe("Name of the component (e.g., 'My Plugin', 'hero-section', 'book')."),
  conversationId: z.string().describe("The conversation ID obtained from learn_wordpress_api."),
  slug: z
    .string()
    .optional()
    .describe("Optional slug override. If omitted, generated from name."),
  namespace: z
    .string()
    .optional()
    .describe("PHP namespace or prefix (e.g., 'MyPlugin', 'myplugin'). If omitted, generated from name."),
  description: z
    .string()
    .optional()
    .default("")
    .describe("Description of the component."),
});

export type ScaffoldComponentInput = z.infer<typeof scaffoldComponentSchema>;

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toPrefix(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
}

function toPascalCase(name: string): string {
  return name.replace(/(?:^|[-_ ])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_ ]/g, "");
}

const SCAFFOLDS: Record<string, (input: ScaffoldComponentInput, slug: string, prefix: string, pascal: string) => string> = {

  plugin: (input, slug, prefix, pascal) => `## Plugin: ${input.name}

### File: \`${slug}/${slug}.php\`
\`\`\`php
<?php
/**
 * Plugin Name: ${input.name}
 * Plugin URI:  https://example.com/${slug}
 * Description: ${input.description || "A custom WordPress plugin."}
 * Version:     1.0.0
 * Author:      Your Name
 * Author URI:  https://example.com
 * License:     GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: ${slug}
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('${prefix.toUpperCase()}_VERSION', '1.0.0');
define('${prefix.toUpperCase()}_PATH', plugin_dir_path(__FILE__));
define('${prefix.toUpperCase()}_URL', plugin_dir_url(__FILE__));

// Activation
register_activation_hook(__FILE__, function () {
    add_option('${prefix}_version', ${prefix.toUpperCase()}_VERSION);
    flush_rewrite_rules();
});

// Deactivation
register_deactivation_hook(__FILE__, function () {
    flush_rewrite_rules();
});

// Initialize
add_action('plugins_loaded', function () {
    load_plugin_textdomain('${slug}', false, dirname(plugin_basename(__FILE__)) . '/languages');
});

// Enqueue assets
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('${slug}', ${prefix.toUpperCase()}_URL . 'assets/css/style.css', [], ${prefix.toUpperCase()}_VERSION);
    wp_enqueue_script('${slug}', ${prefix.toUpperCase()}_URL . 'assets/js/main.js', [], ${prefix.toUpperCase()}_VERSION, true);
});
\`\`\`

### File: \`${slug}/uninstall.php\`
\`\`\`php
<?php
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

delete_option('${prefix}_version');
\`\`\`

### Directory Structure:
\`\`\`
${slug}/
├── ${slug}.php          # Main plugin file
├── uninstall.php        # Cleanup on uninstall
├── includes/            # PHP classes
├── assets/
│   ├── css/style.css
│   └── js/main.js
├── languages/           # Translation files
└── readme.txt           # WordPress.org readme
\`\`\``,

  block: (input, slug, prefix, pascal) => `## Block: ${input.name}

### File: \`blocks/${slug}/block.json\`
\`\`\`json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "${input.namespace || prefix}/${slug}",
    "version": "1.0.0",
    "title": "${input.name}",
    "category": "widgets",
    "description": "${input.description || "A custom block."}",
    "keywords": ["${slug}", "custom"],
    "textdomain": "${input.namespace || prefix}",
    "attributes": {
        "heading": { "type": "string", "default": "" },
        "content": { "type": "string", "default": "" }
    },
    "supports": {
        "html": false,
        "color": { "background": true, "text": true },
        "typography": { "fontSize": true },
        "spacing": { "margin": true, "padding": true }
    },
    "editorScript": "file:./index.js",
    "editorStyle": "file:./index.css",
    "style": "file:./style-index.css",
    "render": "file:./render.php"
}
\`\`\`

### File: \`blocks/${slug}/edit.js\`
\`\`\`js
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes }) {
    const blockProps = useBlockProps();

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Settings', '${input.namespace || prefix}')}>
                    {/* Add controls here */}
                </PanelBody>
            </InspectorControls>
            <div {...blockProps}>
                <RichText
                    tagName="h2"
                    value={attributes.heading}
                    onChange={(heading) => setAttributes({ heading })}
                    placeholder={__('Heading…', '${input.namespace || prefix}')}
                />
                <RichText
                    tagName="p"
                    value={attributes.content}
                    onChange={(content) => setAttributes({ content })}
                    placeholder={__('Content…', '${input.namespace || prefix}')}
                />
            </div>
        </>
    );
}
\`\`\`

### File: \`blocks/${slug}/render.php\`
\`\`\`php
<?php
/**
 * Dynamic block render callback.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Inner blocks content.
 * @param WP_Block $block      Block instance.
 */
?>
<div <?php echo get_block_wrapper_attributes(); ?>>
    <?php if (!empty($attributes['heading'])): ?>
        <h2><?php echo esc_html($attributes['heading']); ?></h2>
    <?php endif; ?>
    <?php if (!empty($attributes['content'])): ?>
        <p><?php echo wp_kses_post($attributes['content']); ?></p>
    <?php endif; ?>
</div>
\`\`\`

### Register: (in plugin or theme functions.php)
\`\`\`php
add_action('init', function () {
    register_block_type(__DIR__ . '/blocks/${slug}');
});
\`\`\``,

  "custom-post-type": (input, slug, prefix) => `## Custom Post Type: ${input.name}

### File: \`includes/cpt-${slug}.php\`
\`\`\`php
<?php
add_action('init', function () {
    $labels = [
        'name'               => __('${input.name}s', '${prefix}'),
        'singular_name'      => __('${input.name}', '${prefix}'),
        'add_new'            => __('Add New', '${prefix}'),
        'add_new_item'       => __('Add New ${input.name}', '${prefix}'),
        'edit_item'          => __('Edit ${input.name}', '${prefix}'),
        'new_item'           => __('New ${input.name}', '${prefix}'),
        'view_item'          => __('View ${input.name}', '${prefix}'),
        'search_items'       => __('Search ${input.name}s', '${prefix}'),
        'not_found'          => __('No ${input.name.toLowerCase()}s found', '${prefix}'),
        'not_found_in_trash' => __('No ${input.name.toLowerCase()}s found in trash', '${prefix}'),
        'all_items'          => __('All ${input.name}s', '${prefix}'),
        'menu_name'          => __('${input.name}s', '${prefix}'),
    ];

    register_post_type('${slug}', [
        'labels'        => $labels,
        'public'        => true,
        'has_archive'   => true,
        'show_in_rest'  => true,
        'menu_icon'     => 'dashicons-admin-post',
        'supports'      => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'revisions'],
        'rewrite'       => ['slug' => '${slug}s', 'with_front' => false],
        'capability_type' => 'post',
    ]);
});
\`\`\``,

  taxonomy: (input, slug, prefix) => `## Taxonomy: ${input.name}

### File: \`includes/tax-${slug}.php\`
\`\`\`php
<?php
add_action('init', function () {
    $labels = [
        'name'              => __('${input.name}s', '${prefix}'),
        'singular_name'     => __('${input.name}', '${prefix}'),
        'search_items'      => __('Search ${input.name}s', '${prefix}'),
        'all_items'         => __('All ${input.name}s', '${prefix}'),
        'parent_item'       => __('Parent ${input.name}', '${prefix}'),
        'parent_item_colon' => __('Parent ${input.name}:', '${prefix}'),
        'edit_item'         => __('Edit ${input.name}', '${prefix}'),
        'update_item'       => __('Update ${input.name}', '${prefix}'),
        'add_new_item'      => __('Add New ${input.name}', '${prefix}'),
        'new_item_name'     => __('New ${input.name} Name', '${prefix}'),
        'menu_name'         => __('${input.name}s', '${prefix}'),
    ];

    register_taxonomy('${slug}', ['post'], [
        'labels'            => $labels,
        'public'            => true,
        'hierarchical'      => true,
        'show_in_rest'      => true,
        'show_admin_column' => true,
        'rewrite'           => ['slug' => '${slug}'],
    ]);
});
\`\`\``,

  "rest-endpoint": (input, slug, prefix) => `## REST Endpoint: ${input.name}

### File: \`includes/rest-${slug}.php\`
\`\`\`php
<?php
add_action('rest_api_init', function () {
    register_rest_route('${prefix}/v1', '/${slug}', [
        [
            'methods'             => 'GET',
            'callback'            => '${prefix}_get_${toPrefix(input.name)}',
            'permission_callback' => '__return_true',
            'args' => [
                'per_page' => ['type' => 'integer', 'default' => 10, 'minimum' => 1, 'maximum' => 100,
                    'sanitize_callback' => 'absint'],
                'page'     => ['type' => 'integer', 'default' => 1, 'minimum' => 1,
                    'sanitize_callback' => 'absint'],
            ],
        ],
        [
            'methods'             => 'POST',
            'callback'            => '${prefix}_create_${toPrefix(input.name)}',
            'permission_callback' => function () { return current_user_can('edit_posts'); },
            'args' => [
                'title' => ['type' => 'string', 'required' => true,
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => function ($v) { return !empty($v); }],
            ],
        ],
    ]);
});

function ${prefix}_get_${toPrefix(input.name)}(WP_REST_Request $request) {
    $per_page = $request->get_param('per_page');
    $page     = $request->get_param('page');

    $query = new WP_Query([
        'post_type'      => 'post',
        'posts_per_page' => $per_page,
        'paged'          => $page,
    ]);

    $items = array_map(function ($post) {
        return [
            'id'    => $post->ID,
            'title' => $post->post_title,
            'link'  => get_permalink($post),
        ];
    }, $query->posts);

    return new WP_REST_Response($items, 200);
}

function ${prefix}_create_${toPrefix(input.name)}(WP_REST_Request $request) {
    $title = $request->get_param('title');

    $post_id = wp_insert_post([
        'post_title'  => $title,
        'post_type'   => 'post',
        'post_status' => 'draft',
    ]);

    if (is_wp_error($post_id)) {
        return new WP_REST_Response(['error' => $post_id->get_error_message()], 500);
    }

    return new WP_REST_Response(['id' => $post_id, 'title' => $title], 201);
}
\`\`\``,

  shortcode: (input, slug, prefix) => `## Shortcode: [${slug}]

### File: \`includes/shortcode-${slug}.php\`
\`\`\`php
<?php
add_shortcode('${slug}', function ($atts, $content = null) {
    $atts = shortcode_atts([
        'title' => '${input.name}',
        'count' => 5,
        'style' => 'default',
    ], $atts, '${slug}');

    ob_start();
    ?>
    <div class="${prefix}-${slug} style-<?php echo esc_attr($atts['style']); ?>">
        <h3><?php echo esc_html($atts['title']); ?></h3>
        <?php if ($content): ?>
            <div class="${prefix}-content"><?php echo wp_kses_post($content); ?></div>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
});
\`\`\`

**Usage:**
\`\`\`
[${slug} title="Hello" count="3" style="modern"]Optional content here[/${slug}]
\`\`\``,

  "elementor-widget": (input, slug, prefix, pascal) => `## Elementor Widget: ${input.name}

### File: \`widgets/class-${slug}-widget.php\`
\`\`\`php
<?php
class ${pascal}_Widget extends \\Elementor\\Widget_Base {

    public function get_name() { return '${prefix}_${toPrefix(input.name)}'; }
    public function get_title() { return __('${input.name}', '${prefix}'); }
    public function get_icon() { return 'eicon-code'; }
    public function get_categories() { return ['general']; }

    protected function register_controls() {
        $this->start_controls_section('content_section', [
            'label' => __('Content', '${prefix}'),
            'tab'   => \\Elementor\\Controls_Manager::TAB_CONTENT,
        ]);

        $this->add_control('title', [
            'label'   => __('Title', '${prefix}'),
            'type'    => \\Elementor\\Controls_Manager::TEXT,
            'default' => __('${input.name}', '${prefix}'),
        ]);

        $this->add_control('description', [
            'label' => __('Description', '${prefix}'),
            'type'  => \\Elementor\\Controls_Manager::WYSIWYG,
        ]);

        $this->add_control('image', [
            'label' => __('Image', '${prefix}'),
            'type'  => \\Elementor\\Controls_Manager::MEDIA,
        ]);

        $this->end_controls_section();

        $this->start_controls_section('style_section', [
            'label' => __('Style', '${prefix}'),
            'tab'   => \\Elementor\\Controls_Manager::TAB_STYLE,
        ]);

        $this->add_control('title_color', [
            'label'     => __('Title Color', '${prefix}'),
            'type'      => \\Elementor\\Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .widget-title' => 'color: {{VALUE}};'],
        ]);

        $this->add_group_control(\\Elementor\\Group_Control_Typography::get_type(), [
            'name'     => 'title_typography',
            'selector' => '{{WRAPPER}} .widget-title',
        ]);

        $this->end_controls_section();
    }

    protected function render() {
        $s = $this->get_settings_for_display();
        ?>
        <div class="${prefix}-widget">
            <h3 class="widget-title"><?php echo esc_html($s['title']); ?></h3>
            <?php if (!empty($s['image']['url'])): ?>
                <img src="<?php echo esc_url($s['image']['url']); ?>" alt="">
            <?php endif; ?>
            <div><?php echo wp_kses_post($s['description']); ?></div>
        </div>
        <?php
    }
}
\`\`\`

### Register:
\`\`\`php
add_action('elementor/widgets/register', function ($manager) {
    require_once __DIR__ . '/widgets/class-${slug}-widget.php';
    $manager->register(new ${pascal}_Widget());
});
\`\`\``,

  "meta-box": (input, slug, prefix) => `## Meta Box: ${input.name}

### File: \`includes/meta-box-${slug}.php\`
\`\`\`php
<?php
add_action('add_meta_boxes', function () {
    add_meta_box(
        '${prefix}_${toPrefix(input.name)}',
        __('${input.name}', '${prefix}'),
        '${prefix}_render_${toPrefix(input.name)}_box',
        ['post', 'page'],
        'normal',
        'high'
    );
});

function ${prefix}_render_${toPrefix(input.name)}_box($post) {
    wp_nonce_field('${prefix}_save_${toPrefix(input.name)}', '${prefix}_${toPrefix(input.name)}_nonce');

    $value = get_post_meta($post->ID, '_${prefix}_${toPrefix(input.name)}', true);
    ?>
    <p>
        <label for="${prefix}_field"><?php esc_html_e('Value', '${prefix}'); ?></label>
        <input type="text" id="${prefix}_field" name="${prefix}_field"
               value="<?php echo esc_attr($value); ?>" class="widefat">
    </p>
    <?php
}

add_action('save_post', function ($post_id) {
    if (!isset($_POST['${prefix}_${toPrefix(input.name)}_nonce'])) return;
    if (!wp_verify_nonce($_POST['${prefix}_${toPrefix(input.name)}_nonce'], '${prefix}_save_${toPrefix(input.name)}')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    if (isset($_POST['${prefix}_field'])) {
        update_post_meta($post_id, '_${prefix}_${toPrefix(input.name)}', sanitize_text_field($_POST['${prefix}_field']));
    }
});
\`\`\``,

  "settings-page": (input, slug, prefix) => `## Settings Page: ${input.name}

### File: \`includes/settings-${slug}.php\`
\`\`\`php
<?php
add_action('admin_menu', function () {
    add_options_page(
        __('${input.name}', '${prefix}'),
        __('${input.name}', '${prefix}'),
        'manage_options',
        '${prefix}-settings',
        '${prefix}_render_settings'
    );
});

add_action('admin_init', function () {
    register_setting('${prefix}_options', '${prefix}_settings', [
        'sanitize_callback' => '${prefix}_sanitize_settings',
    ]);

    add_settings_section('${prefix}_general', __('General', '${prefix}'), null, '${prefix}-settings');

    add_settings_field('${prefix}_api_key', __('API Key', '${prefix}'), function () {
        $opts = get_option('${prefix}_settings', []);
        echo '<input type="text" name="${prefix}_settings[api_key]" value="' . esc_attr($opts['api_key'] ?? '') . '" class="regular-text">';
    }, '${prefix}-settings', '${prefix}_general');

    add_settings_field('${prefix}_enabled', __('Enable', '${prefix}'), function () {
        $opts = get_option('${prefix}_settings', []);
        echo '<label><input type="checkbox" name="${prefix}_settings[enabled]" value="1" ' . checked($opts['enabled'] ?? 0, 1, false) . '> ' . esc_html__('Enable feature', '${prefix}') . '</label>';
    }, '${prefix}-settings', '${prefix}_general');
});

function ${prefix}_sanitize_settings($input) {
    return [
        'api_key' => sanitize_text_field($input['api_key'] ?? ''),
        'enabled' => !empty($input['enabled']) ? 1 : 0,
    ];
}

function ${prefix}_render_settings() {
    if (!current_user_can('manage_options')) return;
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <form action="options.php" method="post">
            <?php settings_fields('${prefix}_options'); ?>
            <?php do_settings_sections('${prefix}-settings'); ?>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
\`\`\``,

  "cron-job": (input, slug, prefix) => `## Cron Job: ${input.name}

### File: \`includes/cron-${slug}.php\`
\`\`\`php
<?php
// Register custom schedule
add_filter('cron_schedules', function ($schedules) {
    $schedules['${prefix}_interval'] = [
        'interval' => HOUR_IN_SECONDS,
        'display'  => __('Every Hour (${input.name})', '${prefix}'),
    ];
    return $schedules;
});

// Schedule on activation
register_activation_hook(${prefix.toUpperCase()}_PATH . '${slug}.php', function () {
    if (!wp_next_scheduled('${prefix}_${toPrefix(input.name)}_event')) {
        wp_schedule_event(time(), '${prefix}_interval', '${prefix}_${toPrefix(input.name)}_event');
    }
});

// Unschedule on deactivation
register_deactivation_hook(${prefix.toUpperCase()}_PATH . '${slug}.php', function () {
    wp_clear_scheduled_hook('${prefix}_${toPrefix(input.name)}_event');
});

// Handle the event
add_action('${prefix}_${toPrefix(input.name)}_event', function () {
    // Your recurring task here
    error_log('${input.name} cron executed at ' . current_time('mysql'));
});
\`\`\``,

  "ajax-handler": (input, slug, prefix) => `## AJAX Handler: ${input.name}

### File: \`includes/ajax-${slug}.php\`
\`\`\`php
<?php
// Enqueue script with localized data
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script('${prefix}-ajax', plugin_dir_url(__DIR__) . 'assets/js/${slug}.js', ['jquery'], '1.0.0', true);
    wp_localize_script('${prefix}-ajax', '${prefix}Ajax', [
        'url'   => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('${prefix}_${toPrefix(input.name)}_nonce'),
    ]);
});

// Logged-in users
add_action('wp_ajax_${prefix}_${toPrefix(input.name)}', '${prefix}_handle_${toPrefix(input.name)}');
// Logged-out users (remove if auth required)
add_action('wp_ajax_nopriv_${prefix}_${toPrefix(input.name)}', '${prefix}_handle_${toPrefix(input.name)}');

function ${prefix}_handle_${toPrefix(input.name)}() {
    check_ajax_referer('${prefix}_${toPrefix(input.name)}_nonce', 'nonce');

    $data = sanitize_text_field($_POST['data'] ?? '');

    if (empty($data)) {
        wp_send_json_error(['message' => __('Data is required.', '${prefix}')], 400);
    }

    // Process...
    $result = ['processed' => true, 'data' => $data];

    wp_send_json_success($result);
}
\`\`\`

### File: \`assets/js/${slug}.js\`
\`\`\`js
jQuery(function ($) {
    $('#${prefix}-form').on('submit', function (e) {
        e.preventDefault();
        $.post(${prefix}Ajax.url, {
            action: '${prefix}_${toPrefix(input.name)}',
            nonce: ${prefix}Ajax.nonce,
            data: $('#${prefix}-input').val()
        })
        .done(function (res) { console.log('Success:', res.data); })
        .fail(function (err) { console.error('Error:', err.responseJSON); });
    });
});
\`\`\``,

  theme: (input, slug, prefix) => `## Theme: ${input.name}

### File: \`${slug}/style.css\`
\`\`\`css
/*
Theme Name: ${input.name}
Theme URI: https://example.com/${slug}
Author: Your Name
Author URI: https://example.com
Description: ${input.description || "A custom WordPress theme."}
Version: 1.0.0
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: ${slug}
Tags: custom-background, custom-logo, full-site-editing
*/
\`\`\`

### File: \`${slug}/functions.php\`
\`\`\`php
<?php
if (!defined('ABSPATH')) exit;

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('html5', ['search-form', 'comment-form', 'gallery', 'caption', 'script', 'style']);
    add_theme_support('automatic-feed-links');
    add_theme_support('wp-block-styles');
    add_theme_support('editor-styles');

    register_nav_menus([
        'primary' => __('Primary Menu', '${slug}'),
        'footer'  => __('Footer Menu', '${slug}'),
    ]);
});

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('${slug}-style', get_stylesheet_uri(), [], '1.0.0');
});
\`\`\`

### Directory Structure:
\`\`\`
${slug}/
├── style.css
├── functions.php
├── index.php
├── header.php
├── footer.php
├── sidebar.php
├── single.php
├── page.php
├── archive.php
├── search.php
├── 404.php
├── template-parts/
│   ├── content.php
│   └── content-none.php
├── assets/
│   ├── css/
│   └── js/
└── screenshot.png (1200×900)
\`\`\``,

  widget: (input, slug, prefix, pascal) => `## Widget: ${input.name}

### File: \`includes/widget-${slug}.php\`
\`\`\`php
<?php
class ${pascal}_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct('${prefix}_${toPrefix(input.name)}', __('${input.name}', '${prefix}'), [
            'description' => __('${input.description || "A custom widget."}', '${prefix}'),
        ]);
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];
        if (!empty($instance['title'])) {
            echo $args['before_title'] . esc_html($instance['title']) . $args['after_title'];
        }
        echo '<p>' . esc_html($instance['content'] ?? '') . '</p>';
        echo $args['after_widget'];
    }

    public function form($instance) {
        $title   = $instance['title'] ?? '${input.name}';
        $content = $instance['content'] ?? '';
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>">Title:</label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>"
                   name="<?php echo esc_attr($this->get_field_name('title')); ?>"
                   value="<?php echo esc_attr($title); ?>">
        </p>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('content')); ?>">Content:</label>
            <textarea class="widefat" id="<?php echo esc_attr($this->get_field_id('content')); ?>"
                      name="<?php echo esc_attr($this->get_field_name('content')); ?>"><?php echo esc_textarea($content); ?></textarea>
        </p>
        <?php
    }

    public function update($new, $old) {
        return [
            'title'   => sanitize_text_field($new['title'] ?? ''),
            'content' => sanitize_textarea_field($new['content'] ?? ''),
        ];
    }
}

add_action('widgets_init', function () {
    register_widget('${pascal}_Widget');
});
\`\`\``,
};

export async function scaffoldComponent(input: ScaffoldComponentInput): Promise<ToolResponse> {
  try {
    requireConversation(input.conversationId);

    const slug = input.slug ?? toSlug(input.name);
    const prefix = input.namespace ?? toPrefix(input.name);
    const pascal = toPascalCase(input.name);

    logger.info("scaffold_component called", { type: input.type, name: input.name, slug });

    const generator = SCAFFOLDS[input.type];
    if (!generator) {
      return errorResponse(`Unknown component type: ${input.type}`);
    }

    const scaffold = generator(input, slug, prefix, pascal);

    const response = `# Scaffold: ${input.type}

${scaffold}

---

💡 **Next Steps**:
1. Copy the code above into your WordPress project
2. Customize the boilerplate for your needs
3. Use \`validate_php\` to check the PHP code
4. Use \`validate_block_json\` to check any block.json files`;

    return successResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("scaffold_component failed", { error: message });
    return errorResponse(message);
  }
}

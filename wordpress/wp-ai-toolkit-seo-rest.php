<?php
/**
 * Plugin Name: WP AI Toolkit - Universal SEO REST API
 * Description: Auto-detects Yoast, Rank Math, or AIOSEO and exposes their SEO fields via REST API. Install one plugin instead of three.
 * Version: 1.0
 * Author: WP AI Toolkit
 *
 * Installation:
 * 1. Upload this file to: wp-content/mu-plugins/wp-ai-toolkit-seo-rest.php
 * 2. That's it - mu-plugins are automatically activated
 *
 * The plugin auto-detects which SEO plugin is active and registers the
 * appropriate REST fields. All three expose the same unified "seo" field
 * with consistent keys: seo_title, meta_description, focus_keyword, etc.
 *
 * REST API Usage:
 *   GET  /wp-json/wp/v2/posts/123          → includes "seo" field
 *   POST /wp-json/wp/v2/posts/123          → update with "seo" field
 *        { "seo": { "seo_title": "...", "meta_description": "...", "focus_keyword": "..." } }
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    $seo_plugin = wp_ai_toolkit_detect_seo_plugin();

    if (!$seo_plugin) {
        return;
    }

    $post_types = get_post_types(['public' => true], 'names');

    foreach ($post_types as $post_type) {
        register_rest_field($post_type, 'seo', [
            'get_callback'    => function ($post) use ($seo_plugin) {
                return wp_ai_toolkit_get_seo_data($post['id'], $seo_plugin);
            },
            'update_callback' => function ($value, $post) use ($seo_plugin) {
                if (!current_user_can('edit_post', $post->ID)) {
                    return new WP_Error('rest_forbidden', 'Permission denied.', ['status' => 403]);
                }
                return wp_ai_toolkit_update_seo_data($post->ID, $value, $seo_plugin);
            },
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'plugin'             => ['type' => 'string', 'description' => 'Active SEO plugin'],
                    'seo_title'          => ['type' => 'string'],
                    'meta_description'   => ['type' => 'string'],
                    'focus_keyword'      => ['type' => 'string'],
                    'seo_score'          => ['type' => 'string'],
                    'canonical_url'      => ['type' => 'string'],
                    'robots_noindex'     => ['type' => 'boolean'],
                    'og_title'           => ['type' => 'string'],
                    'og_description'     => ['type' => 'string'],
                    'og_image'           => ['type' => 'string'],
                    'twitter_title'      => ['type' => 'string'],
                    'twitter_description' => ['type' => 'string'],
                ],
            ],
        ]);
    }

    // Endpoint to check which SEO plugin is active
    register_rest_route('wp-ai-toolkit/v1', '/seo-status', [
        'methods'             => 'GET',
        'callback'            => function () {
            return new WP_REST_Response([
                'active_plugin' => wp_ai_toolkit_detect_seo_plugin(),
                'supported'     => ['yoast', 'rankmath', 'aioseo'],
            ], 200);
        },
        'permission_callback' => '__return_true',
    ]);
});

/**
 * Detect which SEO plugin is active
 */
function wp_ai_toolkit_detect_seo_plugin(): ?string {
    if (defined('WPSEO_VERSION')) {
        return 'yoast';
    }
    if (class_exists('RankMath')) {
        return 'rankmath';
    }
    if (defined('AIOSEO_VERSION') || function_exists('aioseo')) {
        return 'aioseo';
    }
    return null;
}

/**
 * Get SEO data — unified format regardless of plugin
 */
function wp_ai_toolkit_get_seo_data(int $post_id, string $plugin): array {
    $data = ['plugin' => $plugin];

    switch ($plugin) {
        case 'yoast':
            $data['seo_title']          = get_post_meta($post_id, '_yoast_wpseo_title', true);
            $data['meta_description']   = get_post_meta($post_id, '_yoast_wpseo_metadesc', true);
            $data['focus_keyword']      = get_post_meta($post_id, '_yoast_wpseo_focuskw', true);
            $data['seo_score']          = get_post_meta($post_id, '_yoast_wpseo_linkdex', true);
            $data['canonical_url']      = get_post_meta($post_id, '_yoast_wpseo_canonical', true);
            $data['robots_noindex']     = get_post_meta($post_id, '_yoast_wpseo_meta-robots-noindex', true) === '1';
            $data['og_title']           = get_post_meta($post_id, '_yoast_wpseo_opengraph-title', true);
            $data['og_description']     = get_post_meta($post_id, '_yoast_wpseo_opengraph-description', true);
            $data['og_image']           = get_post_meta($post_id, '_yoast_wpseo_opengraph-image', true);
            $data['twitter_title']      = get_post_meta($post_id, '_yoast_wpseo_twitter-title', true);
            $data['twitter_description'] = get_post_meta($post_id, '_yoast_wpseo_twitter-description', true);
            break;

        case 'rankmath':
            $data['seo_title']          = get_post_meta($post_id, 'rank_math_title', true);
            $data['meta_description']   = get_post_meta($post_id, 'rank_math_description', true);
            $data['focus_keyword']      = get_post_meta($post_id, 'rank_math_focus_keyword', true);
            $data['seo_score']          = get_post_meta($post_id, 'rank_math_seo_score', true);
            $data['canonical_url']      = get_post_meta($post_id, 'rank_math_canonical_url', true);
            $robots = get_post_meta($post_id, 'rank_math_robots', true);
            $data['robots_noindex']     = is_array($robots) ? in_array('noindex', $robots) : (strpos($robots ?: '', 'noindex') !== false);
            $data['og_title']           = get_post_meta($post_id, 'rank_math_facebook_title', true);
            $data['og_description']     = get_post_meta($post_id, 'rank_math_facebook_description', true);
            $data['og_image']           = get_post_meta($post_id, 'rank_math_facebook_image', true);
            $data['twitter_title']      = get_post_meta($post_id, 'rank_math_twitter_title', true);
            $data['twitter_description'] = get_post_meta($post_id, 'rank_math_twitter_description', true);
            break;

        case 'aioseo':
            $data = array_merge($data, wp_ai_toolkit_get_aioseo_data($post_id));
            break;
    }

    return $data;
}

/**
 * AIOSEO reads from custom table (aioseo_posts), not post_meta
 */
function wp_ai_toolkit_get_aioseo_data(int $post_id): array {
    global $wpdb;
    $table = $wpdb->prefix . 'aioseo_posts';

    $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
    if (!$table_exists) {
        return [
            'seo_title'        => get_post_meta($post_id, '_aioseo_title', true),
            'meta_description' => get_post_meta($post_id, '_aioseo_description', true),
            'focus_keyword'    => '',
        ];
    }

    $row = $wpdb->get_row($wpdb->prepare(
        "SELECT title, description, keyphrases, canonical_url,
                og_title, og_description, og_image_custom_url,
                twitter_title, twitter_description,
                robots_noindex, seo_score
         FROM {$table} WHERE post_id = %d",
        $post_id
    ), ARRAY_A);

    if (!$row) {
        return [];
    }

    $keyphrases = json_decode($row['keyphrases'] ?? '{}', true);
    $focus = $keyphrases['focus']['keyphrase'] ?? '';

    return [
        'seo_title'          => $row['title'] ?? '',
        'meta_description'   => $row['description'] ?? '',
        'focus_keyword'      => $focus,
        'seo_score'          => $row['seo_score'] ?? '',
        'canonical_url'      => $row['canonical_url'] ?? '',
        'robots_noindex'     => (bool) ($row['robots_noindex'] ?? false),
        'og_title'           => $row['og_title'] ?? '',
        'og_description'     => $row['og_description'] ?? '',
        'og_image'           => $row['og_image_custom_url'] ?? '',
        'twitter_title'      => $row['twitter_title'] ?? '',
        'twitter_description' => $row['twitter_description'] ?? '',
    ];
}

/**
 * Update SEO data — handles all three plugins
 */
function wp_ai_toolkit_update_seo_data(int $post_id, array $value, string $plugin): bool {
    switch ($plugin) {
        case 'yoast':
            $map = [
                'seo_title'          => '_yoast_wpseo_title',
                'meta_description'   => '_yoast_wpseo_metadesc',
                'focus_keyword'      => '_yoast_wpseo_focuskw',
                'canonical_url'      => '_yoast_wpseo_canonical',
                'og_title'           => '_yoast_wpseo_opengraph-title',
                'og_description'     => '_yoast_wpseo_opengraph-description',
                'og_image'           => '_yoast_wpseo_opengraph-image',
                'twitter_title'      => '_yoast_wpseo_twitter-title',
                'twitter_description' => '_yoast_wpseo_twitter-description',
            ];
            foreach ($map as $key => $meta_key) {
                if (isset($value[$key])) {
                    update_post_meta($post_id, $meta_key, sanitize_text_field($value[$key]));
                }
            }
            break;

        case 'rankmath':
            $map = [
                'seo_title'          => 'rank_math_title',
                'meta_description'   => 'rank_math_description',
                'focus_keyword'      => 'rank_math_focus_keyword',
                'canonical_url'      => 'rank_math_canonical_url',
                'og_title'           => 'rank_math_facebook_title',
                'og_description'     => 'rank_math_facebook_description',
                'og_image'           => 'rank_math_facebook_image',
                'twitter_title'      => 'rank_math_twitter_title',
                'twitter_description' => 'rank_math_twitter_description',
            ];
            foreach ($map as $key => $meta_key) {
                if (isset($value[$key])) {
                    update_post_meta($post_id, $meta_key, sanitize_text_field($value[$key]));
                }
            }
            break;

        case 'aioseo':
            wp_ai_toolkit_update_aioseo_data($post_id, $value);
            break;
    }

    return true;
}

/**
 * Update AIOSEO data in custom table
 */
function wp_ai_toolkit_update_aioseo_data(int $post_id, array $value): void {
    global $wpdb;
    $table = $wpdb->prefix . 'aioseo_posts';

    $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
    if (!$table_exists) {
        // Fallback to post_meta
        if (isset($value['seo_title'])) update_post_meta($post_id, '_aioseo_title', sanitize_text_field($value['seo_title']));
        if (isset($value['meta_description'])) update_post_meta($post_id, '_aioseo_description', sanitize_text_field($value['meta_description']));
        return;
    }

    $update = [];
    if (isset($value['seo_title'])) $update['title'] = sanitize_text_field($value['seo_title']);
    if (isset($value['meta_description'])) $update['description'] = sanitize_text_field($value['meta_description']);
    if (isset($value['canonical_url'])) $update['canonical_url'] = esc_url_raw($value['canonical_url']);
    if (isset($value['og_title'])) $update['og_title'] = sanitize_text_field($value['og_title']);
    if (isset($value['og_description'])) $update['og_description'] = sanitize_text_field($value['og_description']);
    if (isset($value['og_image'])) $update['og_image_custom_url'] = esc_url_raw($value['og_image']);
    if (isset($value['twitter_title'])) $update['twitter_title'] = sanitize_text_field($value['twitter_title']);
    if (isset($value['twitter_description'])) $update['twitter_description'] = sanitize_text_field($value['twitter_description']);

    if (isset($value['focus_keyword'])) {
        $existing = $wpdb->get_var($wpdb->prepare("SELECT keyphrases FROM {$table} WHERE post_id = %d", $post_id));
        $keyphrases = json_decode($existing ?: '{}', true);
        $keyphrases['focus'] = ['keyphrase' => sanitize_text_field($value['focus_keyword'])];
        $update['keyphrases'] = wp_json_encode($keyphrases);
    }

    if (empty($update)) return;

    $exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table} WHERE post_id = %d", $post_id));
    if ($exists) {
        $wpdb->update($table, $update, ['post_id' => $post_id]);
    } else {
        $update['post_id'] = $post_id;
        $wpdb->insert($table, $update);
    }
}

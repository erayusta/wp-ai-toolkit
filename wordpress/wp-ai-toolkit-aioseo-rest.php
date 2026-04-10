<?php
/**
 * Plugin Name: WP AI Toolkit - All in One SEO REST API Support
 * Description: Exposes AIOSEO meta fields via the WordPress REST API for the WP AI Toolkit.
 * Version: 1.0
 * Author: WP AI Toolkit
 *
 * Installation:
 * 1. Upload this file to: wp-content/mu-plugins/wp-ai-toolkit-aioseo-rest.php
 * 2. That's it - mu-plugins are automatically activated
 *
 * If the mu-plugins folder doesn't exist, create it.
 *
 * Note: AIOSEO stores data in a custom table (aioseo_posts), not in post_meta.
 * This plugin reads from that table and exposes the data via REST API.
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add a clean REST field group for All in One SEO
 */
add_action('rest_api_init', function () {
    // Only proceed if AIOSEO is active
    if (!defined('AIOSEO_VERSION') && !function_exists('aioseo')) {
        return;
    }

    $post_types = get_post_types(['public' => true], 'names');

    foreach ($post_types as $post_type) {
        register_rest_field($post_type, 'aioseo', [
            'get_callback' => function ($post) {
                global $wpdb;
                $id = $post['id'];

                // AIOSEO stores data in its own table
                $table = $wpdb->prefix . 'aioseo_posts';
                $table_exists = $wpdb->get_var($wpdb->prepare(
                    "SHOW TABLES LIKE %s",
                    $table
                ));

                if (!$table_exists) {
                    // Fallback to post_meta (older AIOSEO versions)
                    return [
                        'title'            => get_post_meta($id, '_aioseo_title', true),
                        'description'      => get_post_meta($id, '_aioseo_description', true),
                        'focus_keyword'    => get_post_meta($id, '_aioseo_keywords', true),
                        'og_title'         => get_post_meta($id, '_aioseo_og_title', true),
                        'og_description'   => get_post_meta($id, '_aioseo_og_description', true),
                        'twitter_title'    => get_post_meta($id, '_aioseo_twitter_title', true),
                        'twitter_description' => get_post_meta($id, '_aioseo_twitter_description', true),
                    ];
                }

                $row = $wpdb->get_row($wpdb->prepare(
                    "SELECT title, description, keyphrases, canonical_url,
                            og_title, og_description, og_image_custom_url,
                            twitter_title, twitter_description,
                            robots_noindex, robots_nofollow,
                            seo_score, pillar_content
                     FROM {$table} WHERE post_id = %d",
                    $id
                ), ARRAY_A);

                if (!$row) {
                    return null;
                }

                // Parse keyphrases JSON
                $keyphrases = json_decode($row['keyphrases'] ?? '{}', true);
                $focus_keyword = '';
                if (!empty($keyphrases['focus']) && !empty($keyphrases['focus']['keyphrase'])) {
                    $focus_keyword = $keyphrases['focus']['keyphrase'];
                }

                return [
                    'title'              => $row['title'] ?? '',
                    'description'        => $row['description'] ?? '',
                    'focus_keyword'      => $focus_keyword,
                    'canonical_url'      => $row['canonical_url'] ?? '',
                    'seo_score'          => $row['seo_score'] ?? '',
                    'pillar_content'     => (bool) ($row['pillar_content'] ?? false),
                    'robots_noindex'     => (bool) ($row['robots_noindex'] ?? false),
                    'robots_nofollow'    => (bool) ($row['robots_nofollow'] ?? false),
                    'og_title'           => $row['og_title'] ?? '',
                    'og_description'     => $row['og_description'] ?? '',
                    'og_image'           => $row['og_image_custom_url'] ?? '',
                    'twitter_title'      => $row['twitter_title'] ?? '',
                    'twitter_description' => $row['twitter_description'] ?? '',
                ];
            },
            'update_callback' => function ($value, $post) {
                if (!current_user_can('edit_post', $post->ID)) {
                    return new WP_Error('rest_forbidden', 'Permission denied.', ['status' => 403]);
                }

                global $wpdb;
                $table = $wpdb->prefix . 'aioseo_posts';
                $table_exists = $wpdb->get_var($wpdb->prepare(
                    "SHOW TABLES LIKE %s",
                    $table
                ));

                if (!$table_exists) {
                    // Fallback to post_meta
                    $meta_map = [
                        'title'       => '_aioseo_title',
                        'description' => '_aioseo_description',
                        'og_title'    => '_aioseo_og_title',
                        'og_description' => '_aioseo_og_description',
                        'twitter_title' => '_aioseo_twitter_title',
                        'twitter_description' => '_aioseo_twitter_description',
                    ];

                    foreach ($meta_map as $key => $meta_key) {
                        if (isset($value[$key])) {
                            update_post_meta($post->ID, $meta_key, sanitize_text_field($value[$key]));
                        }
                    }

                    return true;
                }

                // Update AIOSEO custom table
                $update_data = [];

                if (isset($value['title'])) $update_data['title'] = sanitize_text_field($value['title']);
                if (isset($value['description'])) $update_data['description'] = sanitize_text_field($value['description']);
                if (isset($value['canonical_url'])) $update_data['canonical_url'] = esc_url_raw($value['canonical_url']);
                if (isset($value['og_title'])) $update_data['og_title'] = sanitize_text_field($value['og_title']);
                if (isset($value['og_description'])) $update_data['og_description'] = sanitize_text_field($value['og_description']);
                if (isset($value['og_image'])) $update_data['og_image_custom_url'] = esc_url_raw($value['og_image']);
                if (isset($value['twitter_title'])) $update_data['twitter_title'] = sanitize_text_field($value['twitter_title']);
                if (isset($value['twitter_description'])) $update_data['twitter_description'] = sanitize_text_field($value['twitter_description']);

                if (isset($value['focus_keyword'])) {
                    $existing = $wpdb->get_var($wpdb->prepare(
                        "SELECT keyphrases FROM {$table} WHERE post_id = %d",
                        $post->ID
                    ));
                    $keyphrases = json_decode($existing ?: '{}', true);
                    $keyphrases['focus'] = ['keyphrase' => sanitize_text_field($value['focus_keyword'])];
                    $update_data['keyphrases'] = wp_json_encode($keyphrases);
                }

                if (empty($update_data)) {
                    return true;
                }

                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table} WHERE post_id = %d",
                    $post->ID
                ));

                if ($exists) {
                    $wpdb->update($table, $update_data, ['post_id' => $post->ID]);
                } else {
                    $update_data['post_id'] = $post->ID;
                    $wpdb->insert($table, $update_data);
                }

                return true;
            },
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'title'              => ['type' => 'string'],
                    'description'        => ['type' => 'string'],
                    'focus_keyword'      => ['type' => 'string'],
                    'canonical_url'      => ['type' => 'string'],
                    'seo_score'          => ['type' => 'string'],
                    'pillar_content'     => ['type' => 'boolean'],
                    'robots_noindex'     => ['type' => 'boolean'],
                    'robots_nofollow'    => ['type' => 'boolean'],
                    'og_title'           => ['type' => 'string'],
                    'og_description'     => ['type' => 'string'],
                    'og_image'           => ['type' => 'string'],
                    'twitter_title'      => ['type' => 'string'],
                    'twitter_description' => ['type' => 'string'],
                ],
            ],
        ]);
    }
});

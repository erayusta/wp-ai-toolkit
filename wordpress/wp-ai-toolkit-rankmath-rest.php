<?php
/**
 * Plugin Name: WP AI Toolkit - Rank Math REST API Support
 * Description: Exposes Rank Math SEO meta fields via the WordPress REST API for the WP AI Toolkit.
 * Version: 1.0
 * Author: WP AI Toolkit
 *
 * Installation:
 * 1. Upload this file to: wp-content/mu-plugins/wp-ai-toolkit-rankmath-rest.php
 * 2. That's it - mu-plugins are automatically activated
 *
 * If the mu-plugins folder doesn't exist, create it.
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register Rank Math SEO meta fields for REST API access
 */
add_action('init', function () {
    // Only proceed if Rank Math is active
    if (!class_exists('RankMath')) {
        return;
    }

    $rankmath_meta_fields = [
        'rank_math_focus_keyword' => [
            'description' => 'Rank Math Focus Keyword',
        ],
        'rank_math_title' => [
            'description' => 'Rank Math SEO Title',
        ],
        'rank_math_description' => [
            'description' => 'Rank Math Meta Description',
        ],
        'rank_math_seo_score' => [
            'description' => 'Rank Math SEO Score',
        ],
        'rank_math_canonical_url' => [
            'description' => 'Rank Math Canonical URL',
        ],
        'rank_math_robots' => [
            'description' => 'Rank Math Robots Meta (noindex, nofollow, etc.)',
        ],
        'rank_math_advanced_robots' => [
            'description' => 'Rank Math Advanced Robots (max-snippet, max-image-preview, etc.)',
        ],
        'rank_math_facebook_title' => [
            'description' => 'Rank Math Facebook/OG Title',
        ],
        'rank_math_facebook_description' => [
            'description' => 'Rank Math Facebook/OG Description',
        ],
        'rank_math_facebook_image' => [
            'description' => 'Rank Math Facebook/OG Image URL',
        ],
        'rank_math_twitter_title' => [
            'description' => 'Rank Math Twitter Title',
        ],
        'rank_math_twitter_description' => [
            'description' => 'Rank Math Twitter Description',
        ],
        'rank_math_schema_Article' => [
            'description' => 'Rank Math Schema - Article',
        ],
    ];

    $post_types = get_post_types(['public' => true], 'names');

    foreach ($rankmath_meta_fields as $meta_key => $args) {
        foreach ($post_types as $post_type) {
            register_post_meta($post_type, $meta_key, [
                'show_in_rest'      => true,
                'single'            => true,
                'type'              => 'string',
                'description'       => $args['description'],
                'auth_callback'     => function () {
                    return current_user_can('edit_posts');
                },
            ]);
        }
    }
});

/**
 * Add a clean REST field group for Rank Math
 */
add_action('rest_api_init', function () {
    if (!class_exists('RankMath')) {
        return;
    }

    $post_types = get_post_types(['public' => true], 'names');

    foreach ($post_types as $post_type) {
        register_rest_field($post_type, 'rankmath_seo', [
            'get_callback' => function ($post) {
                $id = $post['id'];
                return [
                    'focus_keyword'       => get_post_meta($id, 'rank_math_focus_keyword', true),
                    'seo_title'           => get_post_meta($id, 'rank_math_title', true),
                    'meta_description'    => get_post_meta($id, 'rank_math_description', true),
                    'seo_score'           => get_post_meta($id, 'rank_math_seo_score', true),
                    'canonical_url'       => get_post_meta($id, 'rank_math_canonical_url', true),
                    'robots'              => get_post_meta($id, 'rank_math_robots', true),
                    'og_title'            => get_post_meta($id, 'rank_math_facebook_title', true),
                    'og_description'      => get_post_meta($id, 'rank_math_facebook_description', true),
                    'og_image'            => get_post_meta($id, 'rank_math_facebook_image', true),
                    'twitter_title'       => get_post_meta($id, 'rank_math_twitter_title', true),
                    'twitter_description' => get_post_meta($id, 'rank_math_twitter_description', true),
                ];
            },
            'update_callback' => function ($value, $post) {
                if (!current_user_can('edit_post', $post->ID)) {
                    return new WP_Error('rest_forbidden', 'Permission denied.', ['status' => 403]);
                }

                $map = [
                    'focus_keyword'    => 'rank_math_focus_keyword',
                    'seo_title'        => 'rank_math_title',
                    'meta_description' => 'rank_math_description',
                    'canonical_url'    => 'rank_math_canonical_url',
                    'robots'           => 'rank_math_robots',
                    'og_title'         => 'rank_math_facebook_title',
                    'og_description'   => 'rank_math_facebook_description',
                    'og_image'         => 'rank_math_facebook_image',
                    'twitter_title'    => 'rank_math_twitter_title',
                    'twitter_description' => 'rank_math_twitter_description',
                ];

                foreach ($map as $key => $meta_key) {
                    if (isset($value[$key])) {
                        update_post_meta($post->ID, $meta_key, sanitize_text_field($value[$key]));
                    }
                }

                return true;
            },
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'focus_keyword'       => ['type' => 'string'],
                    'seo_title'           => ['type' => 'string'],
                    'meta_description'    => ['type' => 'string'],
                    'seo_score'           => ['type' => 'string'],
                    'canonical_url'       => ['type' => 'string'],
                    'robots'              => ['type' => 'string'],
                    'og_title'            => ['type' => 'string'],
                    'og_description'      => ['type' => 'string'],
                    'og_image'            => ['type' => 'string'],
                    'twitter_title'       => ['type' => 'string'],
                    'twitter_description' => ['type' => 'string'],
                ],
            ],
        ]);
    }
});

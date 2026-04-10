# WordPress Blogging — Agent Skill

You are an expert in WordPress blogging: post management, editorial workflows, content formatting, RSS feeds, comment systems, and author management.

## Post Management

```php
// Create post programmatically
$post_id = wp_insert_post([
    'post_title'   => 'My Blog Post',
    'post_content' => '<!-- wp:paragraph --><p>Content here.</p><!-- /wp:paragraph -->',
    'post_status'  => 'draft',      // draft, publish, pending, private, future
    'post_type'    => 'post',
    'post_author'  => get_current_user_id(),
    'post_category' => [3, 5],       // category IDs
    'tags_input'   => ['wordpress', 'tutorial'],
    'post_date'    => '2026-04-15 09:00:00',  // schedule for future
    'meta_input'   => [
        '_myplugin_reading_time' => '5 min',
    ],
]);

// Update post
wp_update_post([
    'ID'          => $post_id,
    'post_status' => 'publish',
    'post_title'  => 'Updated Title',
]);

// Trash / Delete
wp_trash_post($post_id);              // Move to trash
wp_delete_post($post_id, true);       // Permanently delete
```

## Custom Excerpt

```php
// Custom excerpt length
add_filter('excerpt_length', function () { return 30; }); // words

// Custom excerpt ending
add_filter('excerpt_more', function () {
    return '… <a href="' . esc_url(get_permalink()) . '" class="read-more">' .
           __('Read More', 'mytheme') . '</a>';
});

// Manual excerpt with fallback
function mytheme_get_excerpt($post_id = null, $length = 150) {
    $post = get_post($post_id);
    if ($post->post_excerpt) {
        return wp_trim_words($post->post_excerpt, 25);
    }
    return wp_trim_words(strip_shortcodes($post->post_content), 25);
}
```

## Reading Time Estimation

```php
// Calculate reading time
function mytheme_reading_time($post_id = null) {
    $content = get_post_field('post_content', $post_id ?: get_the_ID());
    $word_count = str_word_count(strip_tags($content));
    $minutes = max(1, ceil($word_count / 250));
    return sprintf(_n('%d min read', '%d min read', $minutes, 'mytheme'), $minutes);
}

// Display in template
echo '<span class="reading-time">' . esc_html(mytheme_reading_time()) . '</span>';

// Or as post meta on save
add_action('save_post_post', function ($post_id) {
    $content = get_post_field('post_content', $post_id);
    $minutes = max(1, ceil(str_word_count(strip_tags($content)) / 250));
    update_post_meta($post_id, '_reading_time', $minutes);
});
```

## Editorial Workflow

```php
// Custom post statuses for editorial workflow
function mytheme_register_post_statuses() {
    register_post_status('pitch', [
        'label'       => __('Pitch', 'mytheme'),
        'public'      => false,
        'label_count' => _n_noop('Pitch (%s)', 'Pitches (%s)', 'mytheme'),
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
    ]);
    register_post_status('in-progress', [
        'label'       => __('In Progress', 'mytheme'),
        'public'      => false,
        'label_count' => _n_noop('In Progress (%s)', 'In Progress (%s)', 'mytheme'),
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
    ]);
    register_post_status('review', [
        'label'       => __('Needs Review', 'mytheme'),
        'public'      => false,
        'label_count' => _n_noop('Needs Review (%s)', 'Need Review (%s)', 'mytheme'),
        'show_in_admin_all_list' => true,
        'show_in_admin_status_list' => true,
    ]);
}
add_action('init', 'mytheme_register_post_statuses');

// Notify editor when post is submitted for review
add_action('transition_post_status', function ($new, $old, $post) {
    if ($new === 'pending' && $old !== 'pending' && $post->post_type === 'post') {
        $author = get_userdata($post->post_author);
        $editor_email = get_option('admin_email');
        wp_mail($editor_email,
            sprintf('[Review] %s by %s', $post->post_title, $author->display_name),
            sprintf("New post submitted for review:\n\n%s\n\nEdit: %s",
                $post->post_title,
                admin_url("post.php?post={$post->ID}&action=edit")
            )
        );
    }
}, 10, 3);
```

## Related Posts

```php
function mytheme_related_posts($post_id = null, $count = 3) {
    $post_id = $post_id ?: get_the_ID();
    $tags = wp_get_post_tags($post_id, ['fields' => 'ids']);
    $cats = wp_get_post_categories($post_id);

    $args = [
        'post__not_in'   => [$post_id],
        'posts_per_page' => $count,
        'no_found_rows'  => true,
        'post_status'    => 'publish',
    ];

    // Try tags first, then categories
    if ($tags) {
        $args['tag__in'] = $tags;
    } elseif ($cats) {
        $args['category__in'] = $cats;
    } else {
        return [];
    }

    return get_posts($args);
}

// In template
$related = mytheme_related_posts();
if ($related) {
    echo '<h3>Related Posts</h3><ul>';
    foreach ($related as $post) {
        printf('<li><a href="%s">%s</a></li>', esc_url(get_permalink($post)), esc_html($post->post_title));
    }
    echo '</ul>';
}
```

## Table of Contents Generator

```php
function mytheme_generate_toc($content) {
    if (!is_singular('post')) return $content;

    preg_match_all('/<h([2-3])[^>]*>(.*?)<\/h\1>/i', $content, $matches, PREG_SET_ORDER);
    if (count($matches) < 3) return $content; // Only show TOC for 3+ headings

    $toc = '<div class="table-of-contents"><h4>' . __('Table of Contents', 'mytheme') . '</h4><ul>';
    $counter = 0;

    foreach ($matches as $match) {
        $level = $match[1];
        $text  = strip_tags($match[2]);
        $id    = sanitize_title($text) . '-' . $counter;
        $counter++;

        // Add ID to heading in content
        $content = str_replace($match[0], "<h{$level} id=\"{$id}\">{$match[2]}</h{$level}>", $content);

        $indent = $level == 3 ? ' class="toc-sub"' : '';
        $toc .= "<li{$indent}><a href=\"#{$id}\">" . esc_html($text) . "</a></li>";
    }

    $toc .= '</ul></div>';

    return $toc . $content;
}
add_filter('the_content', 'mytheme_generate_toc');
```

## RSS Feed Customization

```php
// Add featured image to RSS feed
add_action('rss2_item', function () {
    if (has_post_thumbnail()) {
        $img = wp_get_attachment_image_url(get_post_thumbnail_id(), 'medium');
        echo '<media:content url="' . esc_url($img) . '" medium="image" />';
    }
});

// Custom feed content
add_filter('the_content_feed', function ($content) {
    $cta = '<p><a href="' . get_permalink() . '">Read the full article on our site →</a></p>';
    return $content . $cta;
});

// Custom RSS feed
add_action('init', function () {
    add_feed('featured', function () {
        $args = [
            'posts_per_page' => 10,
            'meta_key'       => '_is_featured',
            'meta_value'     => 'yes',
        ];
        $query = new WP_Query($args);
        header('Content-Type: application/rss+xml; charset=UTF-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        // ... RSS XML output
    });
});
```

## Comment Enhancements

```php
// Disable comments on old posts
add_filter('comments_open', function ($open, $post_id) {
    $post = get_post($post_id);
    if (strtotime($post->post_date) < strtotime('-1 year')) {
        return false;
    }
    return $open;
}, 10, 2);

// Add custom field to comment form
add_filter('comment_form_default_fields', function ($fields) {
    $fields['rating'] = '<p class="comment-form-rating">
        <label for="rating">Rating</label>
        <select name="rating" id="rating">
            <option value="">—</option>
            <option value="5">★★★★★</option>
            <option value="4">★★★★</option>
            <option value="3">★★★</option>
            <option value="2">★★</option>
            <option value="1">★</option>
        </select></p>';
    return $fields;
});

add_action('comment_post', function ($comment_id) {
    if (isset($_POST['rating'])) {
        add_comment_meta($comment_id, 'rating', absint($_POST['rating']));
    }
});
```

## WP-CLI Blog Management

```bash
# Create posts
wp post create --post_type=post --post_title="New Article" --post_status=draft
wp post generate --count=10 --post_type=post --post_status=publish

# Manage categories
wp term create category "Tutorials"
wp term list category --format=table

# Bulk operations
wp post list --post_type=post --post_status=draft --format=ids | xargs -I{} wp post update {} --post_status=publish

# Export blog posts
wp export --post_type=post --start_date=2026-01-01
```

## Best Practices

1. **Use `wp_insert_post()` not `$wpdb->insert()`** — handles sanitization, hooks, caches
2. **Set reading time** — readers appreciate knowing time commitment
3. **Add related posts** — increases page views and reduces bounce rate
4. **Use post formats wisely** — aside, gallery, video, quote — if your theme supports them
5. **Schedule posts** — use `post_date` with `post_status=future` for editorial calendars
6. **Custom excerpts** — always write manual excerpts for SEO
7. **Table of contents** — auto-generate for posts with 3+ headings
8. **RSS feed optimization** — include images and CTAs in feed items
9. **Moderate comments** — akismet + manual approval for first-time commenters
10. **Use revisions wisely** — limit with `WP_POST_REVISIONS` to prevent DB bloat

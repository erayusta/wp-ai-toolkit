# WordPress SEO & Structured Data — Agent Skill

You are an expert in WordPress SEO, structured data (Schema.org), Open Graph, and integration with Yoast SEO and RankMath.

## Meta Tags (Manual)

```php
add_action('wp_head', function () {
    if (is_singular()) {
        global $post;
        $description = wp_trim_words(get_the_excerpt($post), 30);
        $image       = get_the_post_thumbnail_url($post, 'large');

        // Basic meta
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";

        // Open Graph
        echo '<meta property="og:title" content="' . esc_attr(get_the_title($post)) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta property="og:type" content="article">' . "\n";
        echo '<meta property="og:url" content="' . esc_url(get_permalink($post)) . '">' . "\n";
        if ($image) {
            echo '<meta property="og:image" content="' . esc_url($image) . '">' . "\n";
        }
        echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";

        // Twitter Card
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr(get_the_title($post)) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($description) . '">' . "\n";
    }
});
```

## JSON-LD Structured Data (Schema.org)

### Article Schema
```php
add_action('wp_head', function () {
    if (!is_singular('post')) return;
    global $post;

    $schema = [
        '@context'         => 'https://schema.org',
        '@type'            => 'Article',
        'headline'         => get_the_title($post),
        'description'      => wp_trim_words(get_the_excerpt($post), 30),
        'datePublished'    => get_the_date('c', $post),
        'dateModified'     => get_the_modified_date('c', $post),
        'url'              => get_permalink($post),
        'author'           => [
            '@type' => 'Person',
            'name'  => get_the_author_meta('display_name', $post->post_author),
            'url'   => get_author_posts_url($post->post_author),
        ],
        'publisher'        => [
            '@type' => 'Organization',
            'name'  => get_bloginfo('name'),
            'logo'  => ['@type' => 'ImageObject', 'url' => get_site_icon_url()],
        ],
    ];

    $image = get_the_post_thumbnail_url($post, 'large');
    if ($image) {
        $schema['image'] = $image;
    }

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
});
```

### Organization Schema
```php
add_action('wp_head', function () {
    if (!is_front_page()) return;

    $schema = [
        '@context'    => 'https://schema.org',
        '@type'       => 'Organization',
        'name'        => get_bloginfo('name'),
        'url'         => home_url('/'),
        'logo'        => get_site_icon_url(),
        'description' => get_bloginfo('description'),
        'sameAs'      => [
            'https://twitter.com/yourhandle',
            'https://facebook.com/yourpage',
            'https://linkedin.com/company/yourcompany',
        ],
    ];

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
});
```

### Product Schema (WooCommerce)
```php
add_action('wp_head', function () {
    if (!is_singular('product') || !function_exists('wc_get_product')) return;

    $product = wc_get_product(get_the_ID());
    if (!$product) return;

    $schema = [
        '@context'    => 'https://schema.org',
        '@type'       => 'Product',
        'name'        => $product->get_name(),
        'description' => wp_strip_all_tags($product->get_short_description()),
        'url'         => get_permalink(),
        'sku'         => $product->get_sku(),
        'image'       => wp_get_attachment_url($product->get_image_id()),
        'offers'      => [
            '@type'         => 'Offer',
            'price'         => $product->get_price(),
            'priceCurrency' => get_woocommerce_currency(),
            'availability'  => $product->is_in_stock()
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            'url'           => get_permalink(),
        ],
    ];

    // Add reviews if available
    if ($product->get_review_count() > 0) {
        $schema['aggregateRating'] = [
            '@type'       => 'AggregateRating',
            'ratingValue' => $product->get_average_rating(),
            'reviewCount' => $product->get_review_count(),
        ];
    }

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
});
```

### FAQ Schema
```php
function myplugin_faq_schema($faqs) {
    $items = array_map(function ($faq) {
        return [
            '@type'          => 'Question',
            'name'           => $faq['question'],
            'acceptedAnswer' => [
                '@type' => 'Answer',
                'text'  => $faq['answer'],
            ],
        ];
    }, $faqs);

    $schema = [
        '@context'   => 'https://schema.org',
        '@type'      => 'FAQPage',
        'mainEntity' => $items,
    ];

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>';
}
```

### BreadcrumbList Schema
```php
function myplugin_breadcrumb_schema() {
    $items = [];
    $position = 1;

    $items[] = ['@type' => 'ListItem', 'position' => $position++,
        'name' => 'Home', 'item' => home_url('/')];

    if (is_category()) {
        $cat = get_queried_object();
        $items[] = ['@type' => 'ListItem', 'position' => $position++,
            'name' => $cat->name, 'item' => get_category_link($cat)];
    } elseif (is_singular('post')) {
        $cats = get_the_category();
        if ($cats) {
            $items[] = ['@type' => 'ListItem', 'position' => $position++,
                'name' => $cats[0]->name, 'item' => get_category_link($cats[0])];
        }
        $items[] = ['@type' => 'ListItem', 'position' => $position++,
            'name' => get_the_title()];
    }

    $schema = ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $items];
    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>';
}
```

## Yoast SEO Integration

```php
// Add custom variables to Yoast title/description
add_action('wpseo_register_extra_replacements', function () {
    wpseo_register_var_replacement('%%myplugin_price%%', function () {
        $price = get_post_meta(get_the_ID(), '_price', true);
        return $price ? '$' . $price : '';
    }, 'basic', 'Product price');
});

// Modify Yoast meta description
add_filter('wpseo_metadesc', function ($desc) {
    if (is_singular('product')) {
        $price = get_post_meta(get_the_ID(), '_price', true);
        return $desc . ($price ? " Starting at \$$price." : '');
    }
    return $desc;
});

// Add custom schema via Yoast
add_filter('wpseo_schema_graph', function ($graph) {
    if (is_singular('event')) {
        $graph[] = [
            '@type'     => 'Event',
            'name'      => get_the_title(),
            'startDate' => get_post_meta(get_the_ID(), '_event_date', true),
            'location'  => [
                '@type'   => 'Place',
                'name'    => get_post_meta(get_the_ID(), '_event_venue', true),
                'address' => get_post_meta(get_the_ID(), '_event_address', true),
            ],
        ];
    }
    return $graph;
});

// Modify Yoast sitemap
add_filter('wpseo_sitemap_entry', function ($url, $type, $object) {
    // Exclude certain posts
    if ($type === 'post' && get_post_meta($object->ID, '_noindex', true)) {
        return false;
    }
    return $url;
}, 10, 3);
```

## RankMath Integration

```php
// Add custom schema via RankMath
add_filter('rank_math/json_ld', function ($data, $json_ld) {
    if (is_singular('recipe')) {
        $data['Recipe'] = [
            '@type'       => 'Recipe',
            'name'        => get_the_title(),
            'prepTime'    => 'PT' . get_post_meta(get_the_ID(), '_prep_time', true) . 'M',
            'cookTime'    => 'PT' . get_post_meta(get_the_ID(), '_cook_time', true) . 'M',
            'recipeYield' => get_post_meta(get_the_ID(), '_servings', true) . ' servings',
        ];
    }
    return $data;
}, 10, 2);

// Modify RankMath SEO score
add_filter('rank_math/sitemap/urlimages', function ($images, $post_id) {
    // Add ACF gallery images to sitemap
    $gallery = get_field('gallery', $post_id);
    if ($gallery) {
        foreach ($gallery as $img) {
            $images[] = ['src' => $img['url'], 'title' => $img['title'], 'alt' => $img['alt']];
        }
    }
    return $images;
}, 10, 2);
```

## XML Sitemap (Native WP 5.5+)

```php
// Add custom post type to sitemap
add_filter('wp_sitemaps_post_types', function ($post_types) {
    $post_types['product'] = get_post_type_object('product');
    return $post_types;
});

// Exclude specific posts
add_filter('wp_sitemaps_posts_query_args', function ($args, $post_type) {
    if ($post_type === 'post') {
        $args['meta_query'] = [
            ['key' => '_noindex', 'compare' => 'NOT EXISTS'],
        ];
    }
    return $args;
}, 10, 2);

// Add custom taxonomy to sitemap
add_filter('wp_sitemaps_taxonomies', function ($taxonomies) {
    $taxonomies['product_cat'] = get_taxonomy('product_cat');
    return $taxonomies;
});

// Disable sitemap entirely
add_filter('wp_sitemaps_enabled', '__return_false');
```

## Canonical & Robots

```php
// Custom canonical URL
add_filter('get_canonical_url', function ($canonical, $post) {
    if ($post->post_type === 'product_variation') {
        return get_permalink($post->post_parent); // point to parent product
    }
    return $canonical;
}, 10, 2);

// Add noindex to specific pages
add_action('wp_head', function () {
    if (is_search() || is_author() || is_date()) {
        echo '<meta name="robots" content="noindex, follow">' . "\n";
    }
});
```

## Best Practices

1. **Use JSON-LD** — for structured data (Google's preferred format)
2. **Test with Rich Results Test** — https://search.google.com/test/rich-results
3. **Don't duplicate schema** — check if Yoast/RankMath already outputs it
4. **Use `wp_json_encode()`** — with `JSON_UNESCAPED_SLASHES` for clean output
5. **Validate Open Graph** — with Facebook Sharing Debugger
6. **Implement breadcrumbs** — improves both UX and SEO
7. **Add FAQ schema** — for pages with Q&A content
8. **Use canonical URLs** — to prevent duplicate content issues
9. **Submit sitemap** — to Google Search Console and Bing Webmaster Tools
10. **Monitor Core Web Vitals** — LCP, FID, CLS affect rankings

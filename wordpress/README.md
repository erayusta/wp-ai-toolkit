# WordPress SEO REST API Plugins

> MU-plugins that expose SEO metadata via the WordPress REST API.
> Supports **Yoast SEO**, **Rank Math**, and **All in One SEO**.

## Quick Install

```bash
# Copy the universal plugin to your WordPress site
cp wp-ai-toolkit-seo-rest.php /path/to/wp-content/mu-plugins/
```

That's it. The plugin auto-detects which SEO plugin is active.

## How It Works

The plugin adds a `seo` field to all public post types in the REST API:

```http
GET http://wordpress.test/wp-json/wp/v2/posts/1
```

```json
{
  "id": 1,
  "title": { "rendered": "Hello World" },
  "seo": {
    "plugin": "rankmath",
    "seo_title": "Hello World | My Site",
    "meta_description": "Welcome to my WordPress site.",
    "focus_keyword": "hello world",
    "seo_score": "78",
    "canonical_url": "",
    "og_title": "Hello World",
    "og_description": "Welcome to my WordPress site.",
    "og_image": "",
    "twitter_title": "",
    "twitter_description": ""
  }
}
```

### Write SEO Data

```http
POST http://wordpress.test/wp-json/wp/v2/posts/1
Authorization: Basic base64(username:application_password)
Content-Type: application/json

{
  "seo": {
    "seo_title": "Updated Title | My Site",
    "meta_description": "Updated meta description for SEO.",
    "focus_keyword": "new keyword"
  }
}
```

### Check Active Plugin

```http
GET http://wordpress.test/wp-json/wp-ai-toolkit/v1/seo-status
```

```json
{
  "active_plugin": "rankmath",
  "supported": ["yoast", "rankmath", "aioseo"]
}
```

## Available Plugins

| File | SEO Plugin | When to Use |
|:-----|:-----------|:------------|
| **`wp-ai-toolkit-seo-rest.php`** | Universal (auto-detect) | **Recommended** — works with any SEO plugin |
| `seo-machine-yoast-rest.php` | Yoast SEO only | When you only need Yoast support |
| `wp-ai-toolkit-rankmath-rest.php` | Rank Math only | When you only need RankMath support |
| `wp-ai-toolkit-aioseo-rest.php` | All in One SEO only | When you only need AIOSEO support |

## Unified Field Mapping

All three SEO plugins expose the same field names:

| Field | Yoast Meta Key | Rank Math Meta Key | AIOSEO |
|:------|:--------------|:-------------------|:-------|
| `seo_title` | `_yoast_wpseo_title` | `rank_math_title` | `aioseo_posts.title` |
| `meta_description` | `_yoast_wpseo_metadesc` | `rank_math_description` | `aioseo_posts.description` |
| `focus_keyword` | `_yoast_wpseo_focuskw` | `rank_math_focus_keyword` | `aioseo_posts.keyphrases` |
| `canonical_url` | `_yoast_wpseo_canonical` | `rank_math_canonical_url` | `aioseo_posts.canonical_url` |
| `og_title` | `_yoast_wpseo_opengraph-title` | `rank_math_facebook_title` | `aioseo_posts.og_title` |
| `og_description` | `_yoast_wpseo_opengraph-description` | `rank_math_facebook_description` | `aioseo_posts.og_description` |
| `og_image` | `_yoast_wpseo_opengraph-image` | `rank_math_facebook_image` | `aioseo_posts.og_image_custom_url` |

## Usage with WP AI Toolkit

The `publish_to_wordpress` tool uses these fields automatically:

```
> "Publish my article to wordpress.test with SEO title 'Best Plugins 2026' and focus keyword 'wordpress plugins'"
```

The tool sends:
```json
{
  "title": "Top 10 WordPress Plugins for 2026",
  "content": "<p>...</p>",
  "status": "draft",
  "seo": {
    "seo_title": "Best Plugins 2026 | My Site",
    "meta_description": "Discover the top WordPress plugins...",
    "focus_keyword": "wordpress plugins"
  }
}
```

---

*Part of [WordPress AI Toolkit](../README.md)*

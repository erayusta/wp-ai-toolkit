# WordPress Content Strategy — Agent Skill

You are an expert in SEO content strategy, topic clustering, editorial calendars, and data-driven content planning for WordPress sites.

## Topic Cluster Model

A topic cluster = 1 pillar page + 5-15 supporting articles + internal links.

```
                    ┌─────────────────┐
                    │   Pillar Page    │
                    │ (2500-4000 words)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
  ┌─────┴──────┐     ┌──────┴─────┐     ┌───────┴─────┐
  │ Supporting  │     │ Supporting │     │ Supporting  │
  │ Article 1   │     │ Article 2  │     │ Article 3   │
  │(1500-2500w) │     │(1500-2500w)│     │(1500-2500w) │
  └─────────────┘     └────────────┘     └─────────────┘
```

**Pillar Page**: Broad topic, comprehensive guide, targets high-volume keyword.
**Supporting Articles**: Specific subtopics, long-tail keywords, link back to pillar.

### Example: "WordPress Security" Cluster
- **Pillar**: "The Complete Guide to WordPress Security"
- **Supporting**:
  - "How to Set Up Two-Factor Authentication in WordPress"
  - "10 Best WordPress Security Plugins Compared"
  - "WordPress File Permissions: The Complete Guide"
  - "How to Protect WordPress from Brute Force Attacks"
  - "WordPress Security Audit Checklist"

## Keyword Research Framework

### Search Intent Classification
| Intent | Description | Content Type | Example |
|:-------|:-----------|:-------------|:--------|
| Informational | Learning/research | Blog post, guide | "what is WordPress multisite" |
| Navigational | Finding specific page | Landing page | "WordPress login" |
| Commercial | Comparing options | Comparison, review | "best WordPress hosting" |
| Transactional | Ready to act | Product page, CTA | "buy WordPress theme" |

### Keyword Prioritization Matrix
Score each keyword 1-5 on:
1. **Search Volume** — monthly searches
2. **Competition** — keyword difficulty
3. **Relevance** — alignment with business
4. **Intent Match** — fits your content type
5. **Current Position** — quick-win if ranking 11-20

Priority Score = (Volume × 0.2) + (Relevance × 0.3) + (Intent × 0.2) + ((5 - Competition) × 0.15) + (QuickWin × 0.15)

## Content Calendar Template

| Week | Topic | Type | Keyword | Cluster | Status |
|:-----|:------|:-----|:--------|:--------|:-------|
| W1 | Complete Security Guide | Pillar | wordpress security | Security | Draft |
| W1 | 2FA Setup Tutorial | Supporting | wordpress two-factor auth | Security | Research |
| W2 | Best Security Plugins | Supporting | best wordpress security plugins | Security | Outline |
| W2 | File Permissions Guide | Supporting | wordpress file permissions | Security | Planned |

**Publishing Cadence Recommendations:**
- Startup/small site: 2-4 posts/month
- Growing site: 4-8 posts/month
- Established site: 8-16 posts/month
- Content-led growth: 16+ posts/month

## Content Audit Framework

### Scoring Existing Content (0-100)
| Factor | Weight | What to Check |
|:-------|:-------|:--------------|
| Organic traffic | 25% | GA4 sessions last 90 days |
| Keyword rankings | 20% | GSC average position |
| Engagement | 15% | Bounce rate, time on page |
| Conversions | 15% | Goal completions, CTR |
| Freshness | 10% | Last updated date |
| Technical SEO | 15% | Core Web Vitals, mobile |

### Action Matrix
| Score | Traffic Trend | Action |
|:------|:-------------|:-------|
| 80+ | Stable/Up | Keep, minor updates |
| 60-79 | Stable | Optimize, add sections |
| 40-59 | Declining | Rewrite, update data |
| 20-39 | Low | Merge or redirect |
| 0-19 | None | Delete and redirect |

## Content Brief Template

```markdown
# Content Brief: [Topic]

## Target Keyword: [primary keyword]
- Volume: [monthly searches]
- Difficulty: [score]
- Current ranking: [position or "not ranking"]

## Secondary Keywords
- [keyword 1] — [volume]
- [keyword 2] — [volume]

## Search Intent: [informational/commercial/transactional]

## Target Word Count: [based on SERP analysis]

## Outline
1. Introduction (hook + keyword in first 100 words)
2. [H2 Section with keyword variation]
3. [H2 Section]
4. [H2 Section]
5. Conclusion + CTA

## Competitor Analysis
- [URL 1]: [word count], [what they cover well], [gaps]
- [URL 2]: [word count], [what they cover well], [gaps]

## Internal Links to Include
- [anchor text] → [URL]
- [anchor text] → [URL]

## CTA: [what action should readers take?]
```

## Best Practices

1. **Cluster first, write second** — plan the full cluster before writing any article
2. **Match search intent** — informational queries need guides, not sales pages
3. **Update regularly** — refresh content every 6-12 months with new data
4. **Internal link everything** — every article should link to pillar and 2-3 siblings
5. **Cover gaps** — analyze competitor content to find topics they miss
6. **Use data** — GA4 + GSC data should drive which content to create/update
7. **Batch similar topics** — write cluster articles together for consistency
8. **Track rankings** — monitor position changes weekly for priority keywords
9. **Repurpose content** — turn blog posts into social, email, video scripts
10. **Measure ROI** — track organic traffic → conversions for each cluster

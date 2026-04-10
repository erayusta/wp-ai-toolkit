# WordPress CRO Optimization — Agent Skill

You are an expert in Conversion Rate Optimization for WordPress sites: landing pages, forms, CTAs, A/B testing, and user experience.

## CRO Fundamentals

**Conversion Rate** = (Conversions / Visitors) x 100

| Benchmark | Rate |
|:----------|:-----|
| Average website | 2-3% |
| Good | 5-7% |
| Excellent | 10%+ |
| Landing page average | 5-10% |
| E-commerce average | 1.5-3% |

## Above-the-Fold Checklist

The first screen view must answer 3 questions in under 5 seconds:

1. **What do you offer?** — Clear headline
2. **Why should I care?** — Value proposition / benefit
3. **What should I do?** — Primary CTA button

```html
<!-- Optimal above-the-fold structure -->
<section class="hero">
  <h1>Headline: Clear Value Proposition</h1>
  <p class="subheadline">Supporting statement with specific benefit or proof</p>
  <a href="#" class="cta-primary">Action-Oriented CTA</a>
  <p class="social-proof">Trusted by 10,000+ WordPress developers</p>
</section>
```

## Landing Page Framework (AIDA)

| Stage | Element | Purpose |
|:------|:--------|:--------|
| **A**ttention | Headline + Hero | Stop the scroll, state the problem |
| **I**nterest | Benefits + Features | Show why your solution is different |
| **D**esire | Social Proof + Results | Build trust with testimonials, data |
| **A**ction | CTA + Urgency | Clear next step with motivation |

## Form Optimization

```php
// WordPress form CRO best practices
// 1. Minimize fields — every field reduces conversion by ~5%
// 2. Use placeholder text wisely — don't replace labels
// 3. Use inline validation — show errors as user types
// 4. Smart defaults — pre-fill what you can

// Good: 3 fields (name, email, company)
// Bad: 10 fields (name, email, phone, company, role, size, budget, timeline, message, captcha)
```

### Form Field Optimization
| Fields | Expected Drop-off |
|:-------|:-----------------|
| 1-2 fields | Highest conversion |
| 3-4 fields | ~10-15% drop |
| 5-6 fields | ~20-30% drop |
| 7+ fields | ~40%+ drop |

### Multi-Step Forms
Split long forms into steps to reduce perceived effort:
```
Step 1: Email only (low commitment)
Step 2: Name + Company (invested now)
Step 3: Details (committed)
```

## CTA Button Optimization

### Button Copy
| Weak | Strong | Why |
|:-----|:-------|:----|
| Submit | Get My Free Guide | Value-focused |
| Sign Up | Start Free Trial | Action + benefit |
| Download | Download Checklist | Specific |
| Learn More | See Pricing Plans | Clear next step |
| Click Here | Claim 50% Discount | Urgency + value |

### Button Design
- **Color**: Contrasting color to page background (not just red/green)
- **Size**: Large enough to tap on mobile (min 44x44px)
- **Whitespace**: Breathing room around the button
- **Position**: Above the fold, after value proposition
- **Microcopy**: Add reassurance below: "No credit card required" / "Cancel anytime"

## Trust Signals

| Signal | Implementation |
|:-------|:--------------|
| Testimonials | Real names, photos, company names |
| Star ratings | Schema markup for rich snippets |
| Customer count | "Join 50,000+ customers" |
| Logos | Client/partner logo strip |
| Security badges | SSL, payment processor logos |
| Guarantees | "30-day money-back guarantee" |
| Press mentions | "Featured in TechCrunch, Forbes" |
| Case studies | Specific results with numbers |

## A/B Testing in WordPress

```php
// Simple A/B test with cookie-based assignment
add_action('wp_head', function () {
    if (!isset($_COOKIE['ab_variant'])) {
        $variant = random_int(0, 1) ? 'A' : 'B';
        setcookie('ab_variant', $variant, time() + (30 * DAY_IN_SECONDS), '/');
    }
});

// Use in template
$variant = $_COOKIE['ab_variant'] ?? 'A';
if ($variant === 'A') {
    // Original version
} else {
    // Variant B
}

// Track with GA4 custom event
// gtag('event', 'ab_test', { variant: '<?php echo $variant; ?>', test_name: 'hero_headline' });
```

### What to Test (Priority Order)
1. **Headlines** — highest impact, easiest to test
2. **CTA copy and color** — direct impact on clicks
3. **Form length** — fewer fields = more conversions
4. **Social proof placement** — above vs below the fold
5. **Pricing display** — annual vs monthly, with/without savings
6. **Page layout** — single column vs two column
7. **Images** — product shot vs lifestyle vs illustration

### Statistical Significance
- **Minimum sample**: 1,000 visitors per variant
- **Minimum duration**: 2 full business weeks
- **Confidence level**: 95% (p < 0.05)
- Don't stop early even if one variant looks better

## WordPress CRO Plugins

| Plugin | Purpose |
|:-------|:--------|
| Google Site Kit | GA4 + GSC in WordPress dashboard |
| MonsterInsights | GA4 with enhanced e-commerce tracking |
| OptinMonster | Popups, slide-ins, floating bars |
| WPForms | Conversion-optimized forms |
| TrustPulse | Real-time social proof notifications |
| CartFlows | WooCommerce funnel builder |
| Thrive Optimize | A/B testing for WordPress |

## Popup/Modal Best Practices

```
DO:
- Exit-intent on desktop (mouse moves to close tab)
- Scroll-triggered (after 50-70% scroll)
- Time-delayed (30-60 seconds)
- Offer real value (discount, free resource)
- Easy to close (visible X, click outside)

DON'T:
- Immediately on page load
- Full-screen with no close button
- Multiple popups on same page
- Same popup after user dismissed
- Popups on mobile (Google penalizes)
```

## Checkout Optimization (WooCommerce)

| Issue | Fix |
|:------|:----|
| Cart abandonment | Add trust signals, guest checkout |
| Long checkout form | Reduce to essential fields |
| Hidden shipping costs | Show upfront on product page |
| No payment options | Add PayPal, Apple Pay, Google Pay |
| No urgency | "Only 3 left in stock" |
| No security indicators | SSL badge, payment logos |
| Forced account creation | Enable guest checkout |
| No progress indicator | Add step counter (1/3, 2/3, 3/3) |

## Best Practices

1. **Test one thing at a time** — isolate variables for clear results
2. **Mobile first** — 60%+ of traffic is mobile, optimize for small screens
3. **Speed matters** — every 100ms delay costs ~1% conversion
4. **Reduce friction** — fewer clicks, fewer fields, fewer decisions
5. **Use directional cues** — arrows, eye gaze in images point to CTA
6. **Urgency is powerful** — but only if genuine (real deadlines, real scarcity)
7. **Social proof near CTAs** — place testimonials close to action buttons
8. **Consistent messaging** — ad copy → landing page → CTA should align
9. **Track micro-conversions** — scroll depth, video plays, clicks before macro conversion
10. **Never stop testing** — CRO is iterative, not a one-time project

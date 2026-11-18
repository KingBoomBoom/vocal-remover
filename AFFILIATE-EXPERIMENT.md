# Affiliate measurement experiment

The two candidate placements are on `/vocal-remover/` and `/silence-remover/`. Their traffic ranking has not been verified. Both remain invisible until a real referral URL and confirmed payout eligibility are configured in `assets/affiliate-config.js`.

## Activation

1. Confirm program acceptance and payout eligibility for the operator's actual residence and account.
2. Paste the dashboard-issued HTTPS LALAL.AI URL into `url`; set `payoutConfirmed` and `enabled` to true. The current allowlist accepts lalal.ai and its subdomains. If the dashboard provides another host, verify it before explicitly adding it. Do not rewrite attribution parameters by guesswork.
3. Review both placements on desktop/mobile. Recommendation copy makes no guarantee of mastering approval or a better output. No widget is loaded.
4. Verify GA4 Realtime/DebugView and actual affiliate dashboard reporting. Register `offer_id` and `offer_provider` as event-scoped custom dimensions for subsequent reports. Automated tests do not establish live data collection.

## Events

- `offer_impression`: at least 50% of the card visible continuously for 1 second, document in foreground. Once per placement per document load; returning from BFCache does not count a second impression.
- `offer_click`: primary or middle-click with the same `offer_id`, `offer_provider`, and `page_path`; requests beacon transport. Ad blockers or network failure can still prevent delivery. Neither event proves a purchase.
- A click can happen before a qualified impression; compare clicks and impressions with this limitation. Repeated clicks count separately.
- Impressions use IntersectionObserver geometry and document visibility; they do not prove attention or detect every overlay occlusion.
- No Sub-ID parameter is appended until the provider confirms its exact syntax and reports.

## Excluding operator traffic

GA4 only loads on `cleanstems.com` and `www.cleanstems.com`. Local and preview copies are excluded. On production, set `localStorage.setItem('cleanstems_exclude_analytics', '1')` before reloading. Remove that key and reload to restore measurement. This does not disable the separate existing Vercel Analytics script or retract already transmitted events.

## Verification

Run `node tests/verify-affiliate.cjs`. Also run `node --check` on the new scripts and `git diff --check` before committing.

## Rollback

Set `enabled: false` to hide offers. The original free tools do not depend on this feature. Do not remove the intentional noindex on `/vocal-remover/app/` as part of this experiment.

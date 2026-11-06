# Promotions Screen: API Requirements for Mobile

Nov 6, 2026

## Overview

The mobile promotions screens can be built on today's response, but the claim flow, goal rewards, and time-window promotions need the additions below. This doc lists what the app reads today, what it still needs, and how the UI handles bad or missing data.

- **Endpoint:** `GET https://chickasaw-dev.playerhub.ai/gem/v2/game/promotions`
- **Platform:** native mobile app (phone)
- **Screens:** promotions listing (All, Ready, In progress tabs), promotion detail, in-app claim flow, plus loading, empty, and error states
- **Design:** see [`design/README.md`](../design/README.md)

Priority markers: **P0** blocks launch, **P1** needed for the full design, **P2** nice to have.

## How today's response maps to the UI

Rules apply to `response.promotions[]` unless noted.

| UI element | Rule | Source fields |
| --- | --- | --- |
| Ready tab | `hasAvailablePrizes` is true | `hasAvailablePrizes` |
| In progress tab | Everything not in Ready | `hasAvailablePrizes` |
| Tab counts | Count of promotions per tab | derived |
| Sort order | Ready first, then soonest end date | `hasAvailablePrizes`, `proEndDate` |
| End label | Within 7 days: "Ends in N days" chip; otherwise "Ends Nov 30" | `proEndDate` |
| Card: rewards ready | Gold card, "13 rewards ready", Claim rewards | `availablePrizes.length`, `rewardType`, `expiryDate` |
| Card: one goal | Progress bar, "0 of 7 days", "7 days to go" | `progress.currentValue`, `targetValue`, `remainingValue`, `unit` |
| Card: several goals | One segment per goal, "0 of 4 goals complete" | `totalQualifiers`, `completedQualifiers`, `qualifiers[].isQualified` |
| Card: not started | "Not started" | `progress` is null |
| Card image | Image, else branded fallback tile | `proImageUrl` |
| Card subtitle | Short description, else first qualifier name | `proShortDescription`, `qualifiers[0].qualifierName` |
| Detail: goal rows | Name, status, bar when progress exists | `qualifiers[]`, `status`, `progress` |
| Detail: reward rows | One row per prize, each with its own Claim button | `availablePrizes[]` |
| Detail: claimed rows | Collapsed Claimed group | `redeemedPrizes[]` (on refresh) |
| Detail: about | Description collapses after 5 lines | `proDescription` |
| Detail: rules link | "Official rules" opens externally | `termsUrl` |

## New fields needed

The biggest gaps are a reward preview per goal, progress data for pending goals, and time windows for restricted promotions. Field names are suggestions; equivalents are fine. The full schema is in [`api/promotions-api.openapi.yaml`](../api/promotions-api.openapi.yaml), where every new field is tagged `x-new: true`.

### Response level

| Field | Type | Example | Why | Priority |
| --- | --- | --- | --- | --- |
| `serverTime` | ISO datetime | `2026-11-06T15:00:00Z` | Countdowns use the server clock, not the phone's | P0 |
| `timezone` | IANA name | `America/Chicago` | Dates have no offset today, except `expiryDate` (UTC) | P0 |
| `lastUpdated` | ISO datetime | `2026-11-06T14:58:12Z` | "Updated 2 min ago" and cached-data banner | P1 |
| `totalAvailablePrizes` | integer | `13` | Tab badge and header subtitle | P2 |
| `totalAvailablePrizeValue` | Money | `195 USD` | "$195 to claim" in the header | P2 |

### Promotion level

| Field | Type | Example | Why | Priority |
| --- | --- | --- | --- | --- |
| `eligibilityWindow` | object: `start`, `end`, `label` | first day of membership | Show the player's real deadline ("Today only"), not `proEndDate` | P0 |
| `activeWindows` | array of `start`/`end` | 30th, 9 AM to 10 PM | Show "Opens Nov 30" instead of 0% progress | P1 |
| `nextWindowStart` | ISO datetime | `2026-11-30T09:00:00-06:00` | Drives the upcoming-window card | P1 |
| `qualifierLogic` | enum: `independent`, `sequential`, `all` | `independent` | Tells the UI how goals relate | P1 |
| `maxRewardValue` | Money | `100 USD` | "Earn up to $100" without parsing text | P2 |
| `availablePrizeCount`, `availablePrizeValue` | integer, Money | `13`, `195 USD` | Rewards summary on card and detail | P1 |
| `proTypeName` | string | `streak` | `proType` is an unexplained number (0, 1, 3, 25) | P1 |
| `imageAltText` | string | `New member welcome banner` | Accessibility | P2 |
| `propertyName` | string | `WinStar` | Promotions span WinStar and Riverwind | P2 |
| test filtering | server-side | exclude 605 | Test promotions must not reach players | P0 |

### Qualifier level

| Field | Type | Example | Why | Priority |
| --- | --- | --- | --- | --- |
| `rewardPreview` | object: `type`, `value`, `currency`, `label`, `quantity` | `$15 Reward Play` | Each goal has its own reward, but nothing says what it pays | P0 |
| `displayName` | string | `Earn 25 points` | Current names are internal ("Sum of point 20") | P1 |
| `howToQualify` | string | `Play any game with your card.` | Replaces "Not started yet" with an action | P1 |
| `progress` always present | object, never `null` | `currentValue: 0` | Show "0 of 15 points" for goals not yet started | P0 |
| `metricKey` | string | `daily_points` | Goals that share a counter render as one milestone track | P2 |
| `periodStart`, `periodEnd` | ISO datetime | today 00:00 to 23:59 | Which window counts toward the goal | P1 |

### Progress object

| Field | Type | Example | Why | Priority |
| --- | --- | --- | --- | --- |
| `lastUpdated` | ISO datetime | `2026-11-06T14:51:00Z` | Points post with a delay; sets expectations | P1 |
| `streak` | object: `daysCompleted[]`, `todayStatus`, `resetsAt` | 2 of 7, today pending | Streak tiles and "Play today to keep your streak" | P1 |
| `milestones` | array: `threshold`, `reward` | 25 pts, $15 | Alternative to per-qualifier `rewardPreview` | P2 |

### Prize level

| Field | Type | Example | Why | Priority |
| --- | --- | --- | --- | --- |
| `rewardValue`, `currency` | number, string | `15`, `USD` | Totals like "$195 ready"; value is only in text today | P0 |
| `status` as string enum | `available`, `claimed`, `expired` | `available` | `status: 100` is undocumented (moves to `statusCode`) | P0 |
| `isClaimable` | boolean | `true` | Whether to show a Claim button | P0 |
| `redemptionInstructions` | string | `Insert your card at any participating game.` | Copy for the confirm sheet | P1 |
| `claimedTo` | enum: `card`, `wallet` | `card` | Success message and View link | P1 |
| `balanceUnit` | enum: `count`, `currency`, `points` | `count` | `balanceValue: 1` on a $15 reward is ambiguous | P1 |

### Enum values

| Field | Values |
| --- | --- |
| `qualifiers[].status` | `Pending`, `Upcoming`, `In-Progress`, `Awarded`, `Expired` |
| `prizes[].status` | `available`, `claimed`, `expired` |
| `qualifierLogic` | `independent`, `sequential`, `all` |
| `progress.streak.todayStatus` | `done`, `pending`, `missed` |
| `rewardPreview.type` | `reward_play`, `bonus_play`, `bonus_points`, `food_reward`, `drawing_entry` |
| `claimedTo` | `card`, `wallet` |

## Updated response sample

[`api/examples/promotions-response.json`](../api/examples/promotions-response.json) is today's response with every new field added, the test promotion removed, and the data issues fixed. Progress values are illustrative so each UI state has data. Promotion 608 lists 2 of its 13 available prizes for length.

## Claim endpoint (P0)

The design has an in-app Claim button on every reward, but no claim API exists in today's response. The path below is a proposal.

```http
POST /gem/v2/game/promotions/{promotionId}/prizes/{refId}/claim
Idempotency-Key: <uuid>
```

- One reward per request, identified by `refId`.
- The `Idempotency-Key` header prevents a double-tap or a retry after a timeout from claiming twice. A retry with the same key returns the original result.
- Success returns the prize with `status: claimed`, `redemptionDate`, `claimedTo`, and the promotion's updated `availablePrizeCount` and `availablePrizeValue`. See [`claim-success.json`](../api/examples/claim-success.json).

| Code | HTTP | Meaning | App behavior |
| --- | --- | --- | --- |
| `PRIZE_EXPIRED` | 409 | Past `expiryDate` | Expired sheet with Got it; row shows Expired |
| `ALREADY_CLAIMED` | 409 | Claimed earlier, maybe on another device | No sheet; "Already claimed" toast; row moves to Claimed |
| `NOT_ELIGIBLE` | 403 | Player no longer qualifies | Sheet pointing to the Players Club |
| `SERVICE_UNAVAILABLE` | 503 | Timeout or backend down | Error sheet with Try again (same key) |

## Data issues in the current response

| Promotion | Field | Issue | Fix | Priority |
| --- | --- | --- | --- | --- |
| 608 | `availablePrizes` | Trailing comma after the last item; strict JSON parsers fail | Remove the trailing comma | P0 |
| 605 | whole record | "Mobile Notification Testing" is a test promotion | Exclude test promotions from player responses | P0 |
| 631 | qualifier 115 | Name says "20 – Points Earned" but `targetValue` is 1 | Align name and target | P0 |
| 615 | qualifier names | Names say 15, 20, 50, 250 points; description says 1, 25, 50, 250 | Confirm with marketing (sample follows description) | P0 |
| 615 | `proImageUrl` | Points to a web page, not an image | Use a direct image URL | P1 |
| 614 | `proImageUrl` | Placeholder text instead of a URL | Use a direct image URL or empty string | P1 |
| 608 | `proImageUrl` | Ends with a stray `%22` | Remove the encoded quote | P1 |
| 631, 614 | qualifier 115 | Shared by two promotions; description mentions "Flash Play" | Use per-promotion qualifiers or descriptions | P1 |
| 605 | `progressText` | Text runs together: "1 Points.Flash Play Qualification" | Fix the template | P1 |
| several | `progressText`, names | "1 Points"; trailing spaces; inconsistent casing | Pluralize correctly; trim and normalize | P2 |

## UI fallback rules

Implement these regardless of backend fixes.

| Situation | App behavior |
| --- | --- |
| `proImageUrl` empty, not an image, or fails to load | Branded navy tile with the gold ticket icon |
| `proShortDescription` empty | Show the first qualifier's display name |
| `proDescription` empty | "Details for this promotion are available at the Players Club." |
| `termsUrl` empty | Hide the Official rules link |
| `progress` null | "Not started yet"; no bar |
| `targetValue` is 0 or missing | Hide the bar; show status text only |
| `progressPercentage` disagrees with values | Compute from `currentValue / targetValue` |
| `unit` pluralization | App pluralizes from the number ("1 point", "7 days") |
| Listing request fails, cached data exists | Cached list with "Showing info from [time]" banner |
| Listing request fails, no cache | Full error state with Try again |
| `promotions` empty | "No promotions running for you" with a Browse offers link |
| Ready tab has no items | "No rewards ready yet" with a link to In progress |
| Prize past `expiryDate` but still returned | Hide its Claim button; show "Expired" |
| Unknown `status` value on a qualifier | Treat as not started |

## Open questions

- [ ] What does `proType` mean for each value (0, 1, 3, 25), and which ones need a special layout?
- [ ] What does prize `status: 100` mean, and what are the other values?
- [ ] What does `balanceValue: 1` represent on a $15 reward?
- [ ] Is there an existing claim endpoint, or does it need to be built?
- [ ] Should claimed rewards return in `redeemedPrizes`, and for how long?
- [ ] How often does qualifier progress update after play, and can the API expose that delay?
- [ ] Are ineligible promotions (`isEligible: false`) ever returned, and should the app show them?
- [ ] Can the backend send push notifications for rewards ready and rewards expiring in 24 hours?

# Design

## Preview

Open **[design/index.html](index.html)** through GitHub Pages or a local server to see every screen, with working taps on the interactive ones.

- **GitHub Pages:** once Pages is enabled for this repo (Settings → Pages → Deploy from a branch → `main` / root), the preview is at `https://<owner>.github.io/promotions-mobile-spec/`.
- **Locally:** from the repo root run `python3 -m http.server 8000` and open http://localhost:8000/design/. Opening the HTML file directly from disk won't work, because screens load each other over HTTP.

The original editable canvas is **[Club Passport Promotions](https://claude.ai/artifact/MPM9jPaYRGWGtw8Kd7xzMD)** on Claude (private until its owner shares it).

Built on the Club Passport v4 theme (Montserrat + Plus Jakarta Sans, navy surfaces, gold for rewards, sky blue for progress). Full tokens are on the canvas's handoff row.

## Screens

| Row | Screen | What it shows |
| --- | --- | --- |
| Listing | Listing (interactive) | Tabs, rewards-ready card, streak, goal segments, upcoming windows, tab badge |
| Listing | Ready tab empty | "No rewards ready yet" |
| Listing | Loading | Skeleton cards |
| Listing | No promotions | Empty state with Browse offers |
| Listing | Load error | Full-screen error with Try again |
| Listing | Cached data | "Showing info from 10:42 AM" banner over cached list |
| Detail | Streak (627) | Day tiles, today pending, reset warning |
| Detail | Milestone goals (615) | Shared points track, reward per goal, "Today only" |
| Detail | Upcoming window (631) | Opens date, countdown, Remind me switch |
| Detail | Rewards ready (608) | $ summary, one row per reward, claimed group, interactive claim |
| Claim | Confirm, success | Sheet and toast |
| Claim | Service unavailable, expired, not eligible, already claimed | One state per API error code |
| Handoff | Design tokens | Color, type, radius, spacing, sizes |
| Handoff | Components | Each component with the API fields that drive it |
| Handoff | Display logic and claim flow | Which progress pattern to show; every claim outcome |

## Source files

`source/` holds one file per screen (`*.dc.html`), exported from the canvas. `source/support.js` is a small standalone runtime that renders them in any browser. The markup shows exact sizes, colors, and copy, and each file's script shows the display logic. Open a single screen with `source/Main.dc.html`; detail screens take `?promoId=627` and claim screens take `?view=expired` style parameters.

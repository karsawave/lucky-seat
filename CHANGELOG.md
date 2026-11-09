# Changelog

All notable changes to Lucky Seat are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.2] - 2026-11-09

### Changed
- Apps Script now has its own API version (`API_VERSION` in `Code.gs`, `CODE_GS_API` in `version.js`), separate from the website version. Option 2 admins are asked to redeploy only when `Code.gs` really changes, not after every website release. Scripts deployed from v1.0.0 on keep working without a warning.
- The "update Apps Script" warning text no longer shows version numbers.
- Day arrows: an active arrow is now filled with a clear border and bright icon; a disabled arrow stays faint, so the two are easy to tell apart.
- Seat map numbers are bigger and easier to tap: 36px tall on wide screens, and 6 per row at 40px on phones.

## [1.1.1] - 2026-11-09

### Changed
- Tapping a taken seat on the map now also switches "Your name" to that person, so the big number and details follow. Tapping an empty seat still shows "Seat 16: empty". The saved name only changes when picked from the dropdown.

## [1.1.0] - 2026-11-09

### Added
- Seat map numbers can be tapped to see who sits there ("Seat 05: Eka"); the same row is highlighted in the seat list. "Your name" stays unchanged.

### Changed
- The seat list is now a card, like the ticket above it.
- "Change data source" on the admin screen moved into the link row under the WhatsApp button.

## [1.0.2] - 2026-11-09

### Changed
- License copyright holder is now Karsa Wave (https://github.com/karsawave).
- The repository moved to the Karsa Wave organization. The site is live at https://karsawave.github.io/lucky-seat/, linked from both READMEs.
- CI uses the current GitHub Actions versions (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5), all on Node.js 24.

## [1.0.1] - 2026-11-09

### Added
- MIT license (`LICENSE`), with a License section in both READMEs.

## [1.0.0] - 2026-11-09

### Added
- Light/dark theme toggle next to the language switcher; follows the device by default and remembers the choice.
- Redesigned "Invite link needed" screen: numbered steps, paste-a-link box, and an admin card.
- App version shown in the footer of the app and the setup guide.
- Warning for admins when the deployed Apps Script version doesn't match the website.
- Automated test that checks `sheet.js` and `Code.gs` produce identical draws (`npm test`).
- `CHANGELOG.md`, English `README.md` and Indonesian `README.id.md`.

### Changed
- English is now the default language; Indonesian is the second language (EN | ID).
- Action-based colors: WhatsApp green, link blue, brand for the primary action, separate error red and warning amber.
- File names are now English: `panduan.html` → `guide.html`; templates carry a language suffix (`*-EN`, `*-ID`).
- Apps Script messages fall back to English when no language is set.
- WhatsApp seat-list message: title and date are now separated by `·` instead of a dash.
- README diagrams are now Mermaid (rendered by GitHub); writing cleaned up (no em dashes, no emoji in sentences).
- Old standalone prototype moved to `archive/lucky-seat.html`.
- Project layout: the whole website now lives in `public/` (pages, `config.js`, `assets/{css,js,img}`, `templates/`, `apps-script/Code.gs`); `README.id.md` and the archive moved to `docs/`. Site URLs are unchanged.
- Deployment: GitHub Actions now runs the tests and publishes `public/` to GitHub Pages on every push to `main`. **One-time setting:** Settings → Pages → Source: GitHub Actions.
- Added `.editorconfig` and `.gitattributes` (UTF-8, LF line endings).

### Fixed
- Switching language no longer shifts the layout.

### Apps Script
- `Code.gs` changed (version info, English fallback). Admins using Option 2: paste the new `Code.gs`, then **Manage deployments → New version**.

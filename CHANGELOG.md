# Changelog

All notable changes to Lucky Seat are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

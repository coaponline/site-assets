# Member pages: the new look on Kajabi's own pages

Kajabi draws the library, every course front page, module page and lesson page, and the login page. These files redraw them in the site mock's design (`Academy 2027/site/learn.html`, `course.html`, `lesson.html`, `library.html`, `login.html`). Kajabi's own working parts move into the new layout: the video player, Complete, downloads, the comments and the login form.

## The switch

Kajabi has no draft copy of these pages. Instead, a small snippet (`loader.js`) sits in the theme script boxes and does nothing unless a browser has opted in:

- **On:** open any member page with `?newlook=on`. This browser remembers it.
- **Off:** open any member page with `?newlook=off`.

Where the snippet is (installed 14 Nov 2026):

- **Site theme** "Encore" 2156147178, global setting `js`. Covers /library and /login. It does nothing on any other site page.
- **Learning Resources** product theme 2161883131, global setting `embedded_scripts`.
- **The other 17 course themes**, in their `embedded_scripts`. The list is in `kajabi-build/README.md`.

When the switch is on, the snippet hides the page for a moment (at most 5 seconds) and loads `boot.js` from GitHub Pages.

**Launch day:** change `})(0);` to `})(1);` at the end of the snippet in every theme above. The new look is then on for everyone, and `?newlook=off` still turns it off in one browser.

## Files

| File | What it does |
|---|---|
| `loader.js` | The source of the switch snippet. `snippet-product.html` (course themes) and `snippet-site.js` (site theme) are copies of it, ready to paste. |
| `boot.js` | Works out which page this is, reads what Kajabi drew, builds the new page, then moves Kajabi's working parts in. If anything fails, it puts Kajabi's page back as it was. |
| `el.css`, `learn.css`, `course.css`, `lesson.css`, `library.css`, `login.css` | Copied from the mock's own page styles. Regenerate them from the mock rather than editing them here. |
| `members.css` | Kajabi's parts in their new places: video, Complete, comments, the login form. Also hides Kajabi's original layout. |

## What reads what

| Page | Kajabi address | Built from |
|---|---|---|
| Learn (Lessons front page) | `/products/learning-resources` | The outline, each module page fetched in the background (photos, progress), and Kajabi's Resume link |
| Any other course | `/products/<course>` | The same, without the shelves |
| Module | `/products/<course>/categories/<id>` | Kajabi's module page: banner, progress, lesson list with ticks |
| Lesson | `.../posts/<id>` | Kajabi's lesson page: video, body text, Complete, downloads, previous and next, comments |
| Library | `/library` | Every page of Kajabi's product list. A members check: does /products/learning-resources open? |
| Login | `/login` | Kajabi's sign-in form, moved into the mock's card |

## Names and shelves

The Lessons course's Kajabi modules sit on the mock's shelves by name (`SHELVES` / `LSHELVES` in `boot.js`). Old names are shown with their new ones (`RENAME`), for example Edit Like A Pro shows as Lightroom masterclass. "Module 2 - X" shows as "2. X". If a module is renamed in Kajabi, check the shelf patterns still match.

## Not done yet

- The header's other tabs (Shots, Challenges, High Roller, Extras) have no pages yet. They point to the library or /clifton until those pages exist. Account opens Kajabi's /settings/account and Log out is Kajabi's /logout.
- Find a lesson (the search) isn't on these pages yet, because its index in `site.js` is still the mock's.
- The password reset pages are still Kajabi's own.
- The Academy door on the library is only built once the Cohort 3 course exists.

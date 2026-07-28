BOOKFLOW SAAS -- DESIGN SYSTEM & LAYOUT DOCUMENTATION Version 1.0 \|
Last updated: 2026‑05‑02

Purpose: Single source of truth for CSS, layout, components, and theming
used across the admin panel and public pages.

──────────────────────────────────────────────────────── 1. DESIGN
TOKENS (CSS Custom Properties)
──────────────────────────────────────────────────────── All theme
values are defined inside DashboardLayout\'s \<style jsx\> block and
broadcast with :global(:root).

TOKEN DEFAULT VALUE USAGE \--sidebar-w 220px Width of the desktop
sidebar \--topbar-h 64px Height of the sticky topbar \--bg-page #f1f1f1
Background behind cards \--bg-card #ffffff White card surface
\--bg-sidebar #001e4a Navy sidebar background \--border #e8e8e8 Default
border colour \--text-primary #111111 Main text, headings
\--text-secondary #666666 Subtext, meta information \--text-muted
#aaaaaa Placeholder, disabled text \--accent #111111 Accent colour
(buttons, interactive) \--accent-green #22c55e Success, notification
badge \--radius-card 16px Card / widget border‑radius \--radius-btn 10px
Button border‑radius \--navy #001e4a Sidebar, header backgrounds
\--sap-primary #0a6ed1 Primary SAP‑style blue \--sap-primary-hover
#0854a0 Darker blue for hover

Note: landing page & pricing page define their own colour variables
(\--blue, \--navy, etc.) which are consistent with these values.

──────────────────────────────────────────────────────── 2. LAYOUT
SYSTEM ──────────────────────────────────────────────────────── Every
admin page is wrapped by the DashboardLayout component
(components/DashboardLayout.tsx). The layout is a 2‑column fixed + fluid
design.

2.1 HTML Structure (simplified) \<div class=\"layout\"\> // flex
container, min‑height: 100vh \<aside class=\"sidebar\"\> // fixed, width
= \--sidebar-w \<div class=\"sidebar-logo\"\>...\</div\> \<nav
class=\"sidebar-nav\"\>...\</nav\> \<div
class=\"sidebar-footer\"\>...\</div\> \</aside\> \<div
class=\"layout-body\"\> // flex:1, margin‑left = sidebar width \<header
class=\"topbar\"\> // sticky, height = \--topbar-h ... \</header\>
\<main class=\"main-content\"\> // flex:1, scrolling \<!\-- page content
\--\> \</main\> \</div\> \<!\-- mobile drawer (outside layout‑body)
\--\> \<nav class=\"mobile-drawer\"\>...\</nav\> \</div\>

Key CSS rules: .layout-body { width: calc(100vw - var(\--sidebar-w)); }
// prevents horizontal overflow .main-content { overflow-y: auto;
overflow-x: hidden; } // only main area scrolls vertically .sidebar {
position: fixed; } // always present on desktop (≥768px) On mobile
(≤768px): .sidebar { display: none; }, replaced by a sliding drawer.

2.2 Page Level Container Every admin page uses a top‑level wrapper:
\<div class=\"main-card\"\> \<div class=\"card\"\> ... \</div\> \<div
class=\"card\"\> ... \</div\> \</div\>

.main-card is defined in each page's \<style jsx\> as: .main-card {
display: flex; flex-direction: column; gap: 1rem; max-width: 100%;
margin: 1rem auto; }

──────────────────────────────────────────────────────── 3. COMPONENT
PATTERNS ────────────────────────────────────────────────────────

3.1 Card .card { background: var(\--bg-card, #ffffff); border: 1px solid
var(\--border, #e8e8e8); border-radius: var(\--radius-card, 16px);
overflow: hidden; } A card typically has a header: \<div
class=\"card-header\"\> \<i class=\"fas fa-user-plus\" /\>
\<h2\>Title\</h2\> \</div\>

3.2 Tables Tables are wrapped in .table-wrapper for horizontal overflow.
.table-wrapper { max-width: 100%; overflow-x: auto;
-webkit-overflow-scrolling: touch; } Standard \<table\> markup is used.
Basic table styling (borders, padding) comes from styles/globals.css.

3.3 Buttons Three main button styles: .btn-primary -- Primary action
(blue) .btn-secondary -- Secondary / cancel .btn-danger -- Destructive
(red) Small variant: .btn-sm { padding: 0.3rem 0.8rem; font-size:
0.75rem; min-width: 4rem; } Quick‑actions grid (dashboard): .qa {
display: flex; align-items: center; gap: 0.45rem; padding: 0.65rem
0.85rem; background: #f8f8f8; border: 1px solid #f0f0f0; border-radius:
10px; font-size: 0.78rem; font-weight: 600; color: #333;
text-decoration: none; transition: all 0.15s; } .qa:hover { background:
#111; color: #fff; border-color: #111; transform: translateY(-1px); }

3.4 Forms Form elements are wrapped in .form-group: .form-group {
margin-bottom: 1rem; } Inputs, selects, textareas follow global styles
(see globals.css).

3.5 Modals Shared modal structure (defined locally in each page's
\<style jsx\>): .modal-overlay { position: fixed; top: 0; left: 0;
right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex;
align-items: center; justify-content: center; z-index: 300; padding:
1rem; } .modal { background: white; border-radius: 12px; padding:
1.5rem; max-width: 460px; width: 100%; } .modal-header { display: flex;
justify-content: space-between; align-items: center; margin-bottom:
1rem; } .modal-header h2 { font-family: \'Fraunces\', Georgia, serif;
font-size: 1.3rem; font-weight: 700; color: #001e4a; margin: 0; }
.modal-close { background: none; border: none; font-size: 1.2rem; color:
#4a6278; cursor: pointer; } .modal-body { color: #334155; line-height:
1.6; } .modal-footer { display: flex; gap: 0.5rem; justify-content:
flex-end; margin-top: 1rem; } All modals use e.stopPropagation() to
prevent closing when clicking inside.

3.6 Status Badges ┌──────────┬─────────────┬────────────┐ │ Status │
Background │ Text colour│ ├──────────┼─────────────┼────────────┤ │
pending │ #fef9c3 │ #854d0e │ │ confirmed│ #d1fae5 │ #065f46 │ │
completed│ #e0e7ff │ #3730a3 │ │ cancelled│ #fee2e2 │ #991b1b │
└──────────┴─────────────┴────────────┘

.status-badge { display: inline-block; padding: 0.2rem 0.5rem;
border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; }
(Classes: .badge\--pending, .badge\--confirmed, etc.)

3.7 Feedback / Alert Messages .feedback { margin: 0.5rem 0; padding:
0.5rem 1rem; border-radius: 6px; font-weight: 500; } .feedback\--success
{ background: #d1fae5; color: #065f46; } .feedback\--error { background:
#fee2e2; color: #991b1b; }

──────────────────────────────────────────────────────── 4. COLOR
PALETTE ──────────────────────────────────────────────────────── HEX
NAME USAGE #0a6ed1 Primary Blue Buttons, links, active states #001e4a
Navy Sidebar, topbar glass base #111111 Dark / Accent Primary text,
headings, "Create" button #22c55e Success Green Notification badge,
chart bars #f1f1f1 Light grey Page background #ffffff White Cards,
dropdowns, inputs #e8e8e8 Border grey Card and table borders #aaaaaa
Muted grey Placeholder text, secondary icons #f5f5f5 Hover grey Nav item
hover, background tint

Landing & pricing pages use identical blue/navy/grey values (\--blue,
\--navy, \--muted).

──────────────────────────────────────────────────────── 5. TYPOGRAPHY
──────────────────────────────────────────────────────── CONTEXT FAMILY
WEIGHT SIZE Body / general -apple-system, Helvetica Neue, Arial 400
0.875rem (14px) Sidebar links same as body 500 0.875rem Card titles (h2)
\'Fraunces\', Georgia, serif 700 1.3rem Modal headers \'Fraunces\',
Georgia, serif 700 1.3rem Page headings \'Fraunces\', Georgia, serif
800‑900 1.75‑2.75rem (varies) Pricing page \'Plus Jakarta Sans\' +
\'Fraunces\' varied responsive (clamp())

Fraunces is loaded via Google Fonts in the \<Head\> of each page. Body
font is set by the DashboardLayout.

──────────────────────────────────────────────────────── 6. RESPONSIVE
BREAKPOINTS ──────────────────────────────────────────────────────── ≥
768px Desktop: sidebar visible, topbar sticky. ≤ 768px Tablet/mobile:
sidebar hidden, hamburger menu, drawer slides in. ≤ 480px Extra small:
topbar search hidden, user name hidden, logout icon only.

Implemented in DashboardLayout CSS: \@media (max-width: 768px) {
.sidebar { display: none; } .layout-body { margin-left: 0; }
.mobile-menu-btn { display: flex; } } \@media (max-width: 480px) {
.topbar-search { display: none; } } Admin page grids also have their own
responsive rules, collapsing to single column typically at ≤960px or
≤768px.

──────────────────────────────────────────────────────── 7. JAVASCRIPT /
REACT CONVENTIONS
──────────────────────────────────────────────────────── 7.1 Label /
i18n Management All user‑facing strings come from site.json (or
landing.json / pricing.json for public pages). Pattern: import
siteConfig from \'../../site.json\' const labels =
config.pages.admin.manage_users.form

Fallback mechanism: const labels = { \...DEFAULT,
\...config?.pages?.admin?.manage_services } (This prevents runtime
errors if site.json is missing.)

7.2 Data Fetching Server‑side data is fetched via getServerSideProps
with withSsrAuth and Prisma. Dates are always formatted on the server
using the shared utility lib/formatDate.ts: import { formatDate } from
\'../../lib/formatDate\' const formatted =
formatDate(dateObject.toISOString(), \'MMM d, yyyy · h:mm a\') Never use
new Date().toLocaleDateString() directly in client‑side JSX.

7.3 Hooks & Patterns • useState for local UI state (modals, forms). •
useCallback for functions passed to children (e.g., appointment
approval). • useEffect for side effects (initial data fetch, body scroll
lock).

All CRUD pages follow: fetch\*() to reload list from API.
handleAddSubmit / handleEditSubmit with optimistic UI updates. Confirm
dialog for delete actions (if (!confirm(\...)) return).

7.4 Accessibility (A11Y) • Semantic elements: \<button\>, \<a\>,
\<nav\>. • Aria labels on icon‑only buttons. • Modals trap focus and
close on Escape key. • Skip link on the landing page.

──────────────────────────────────────────────────────── 8. BEST
PRACTICES ────────────────────────────────────────────────────────  1.
Horizontal Overflow -- Always wrap wide tables in .table-wrapper with
overflow‑x: auto. 2. Sticky Elements -- Ensure all ancestors of a sticky
element have overflow: visible. The layout‑body must not have
overflow‑x: hidden if a child is sticky. 3. Dates -- Server‑side
formatting only. 4. Labels -- Never hardcode user‑visible strings; use
site.json. 5. Fallbacks -- Always provide a DEFAULT object for each
page. 6. Notifications -- Use the global notification context
(lib/notifications.tsx) after CRUD operations.

──────────────────────────────────────────────────────── This document
reflects the current state of the admin panel as of the latest commit.
For the landing and pricing pages, refer to their individual JSON files
(landing.json, pricing.json) and the corresponding inline CSS in
pages/index.tsx and pages/pricing.tsx.

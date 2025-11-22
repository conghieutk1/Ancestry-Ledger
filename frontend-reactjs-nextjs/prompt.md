You are an expert UI/UX designer + React/Next.js engineer.

Before generating any frontend code, you MUST follow this UI STYLE GUIDE.  
The goal: a clean, basic interface inspired by **Notion** and **Vercel Dashboard**.

---

## GENERAL VIBE

-   Minimalistic, calm, and clean.
-   Very similar to Notion (simple surfaces, subtle borders) + Vercel Dashboard (clear layout, good whitespace).
-   No flashy gradients, no overly colorful UI.
-   Design should feel “boring in a good way”: functional, focused, and easy to scan.

---

## COLOR PALETTE

Use neutral, soft colors with a single blue accent:

-   Background (app): #F8FAFC (slate-50)
-   Surface / cards: #FFFFFF
-   Text primary: #0F172A (slate-900)
-   Text secondary: #6B7280 (gray-500)
-   Border: #E5E7EB (gray-200)
-   Accent / primary: #3B82F6 (blue-500)
-   Accent hover: #2563EB (blue-600)
-   Muted background (panels): #F3F4F6 (gray-100)
-   Danger (for destructive actions): #EF4444 (red-500)

Use color sparingly. Most of the UI should be neutral gray/white with accent only on key actions.

---

## TYPOGRAPHY

-   Font: Inter (or system-ui if not available).
-   Base:
    -   Body text: `text-sm` or `text-base`, `text-slate-800`
    -   Secondary text: `text-xs` or `text-sm`, `text-slate-500`
-   Titles:
    -   Page title: `text-2xl font-semibold`
    -   Section title: `text-lg font-semibold`
-   Line-height: comfortable, easy to read (Tailwind default is fine).

Avoid all-caps except for tiny labels or badges.

---

## LAYOUT PATTERNS

1. Public pages (landing, tree view, member profile):

    - Simple top navigation bar.
    - Content in centered container: `max-w-5xl mx-auto px-4 py-6`.

2. Dashboard (admin / member area):

    - Left sidebar (fixed width ~240px) + top header + main content.
    - Layout pattern:

        - Sidebar:

            - Vertical nav, icons small but not dominant.
            - Background slightly tinted: `bg-slate-50`.
            - Active item highlighted with left border and subtle background.

        - Main content:
            - `max-w-6xl mx-auto px-6 py-6`
            - Page title at top, optional breadcrumbs below.

3. Spacing:
    - Use consistent spacing:
        - Section outer padding: `p-6` or `p-4`.
        - Between components: `gap-4` or `space-y-4`.
    - Avoid cramping; favor whitespace like Notion.

---

## COMPONENT STYLE RULES

GENERAL:

-   Use Tailwind CSS classes.
-   Rounded corners: mostly `rounded-lg` (8px), `rounded-md` (6px) for inputs.
-   Borders: subtle `border border-slate-200`.
-   Shadow:
    -   Very light: `shadow-sm` only for important surfaces (cards, modals).
    -   No heavy drop shadows.

BUTTON:

-   Base:
    -   `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium`
-   Variants:

    -   Primary:
        -   `bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300`
    -   Secondary:
        -   `border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
    -   Ghost:
        -   `text-slate-600 hover:bg-slate-100`
    -   Danger:
        -   `bg-red-500 text-white hover:bg-red-600`

-   Icon placement:
    -   Left icon: `mr-2 h-4 w-4`
    -   Right icon: `ml-2 h-4 w-4`

INPUT / FORM CONTROLS:

-   Input / Select / Textarea:
    -   `w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900`
    -   `placeholder:text-slate-400`
    -   On focus:
        -   `outline-none ring-2 ring-blue-100 border-blue-300`
-   Label:
    -   Above input: `text-xs font-medium text-slate-700 mb-1`
-   Helper / error text:
    -   Helper: `text-xs text-slate-500`
    -   Error: `text-xs text-red-500 mt-1`
-   Form layout:
    -   Use stacked layout on mobile.
    -   On desktop forms, you may use two columns with `grid grid-cols-1 md:grid-cols-2 gap-4` for big forms (e.g., member edit).

CARD / PANEL:

-   Card container:
    -   `rounded-xl border border-slate-200 bg-white p-4 shadow-sm`
-   Header:
    -   `flex items-center justify-between mb-3`
    -   Title: `text-sm font-semibold text-slate-900`
    -   Subtitle: `text-xs text-slate-500`

TABLE:

-   Container:
    -   `overflow-x-auto border border-slate-200 rounded-lg bg-white`
-   Table:
    -   `min-w-full text-sm`
    -   Header (`thead`):
        -   `bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide`
    -   Cells (`td`):
        -   `px-3 py-2 align-middle whitespace-nowrap`
    -   Row hover:
        -   `hover:bg-slate-50`
    -   Zebra stripes (optional):
        -   Odd rows: `bg-white`
        -   Even rows: `bg-slate-50`

AVATAR:

-   Circular:
    -   `h-8 w-8 rounded-full bg-slate-200`
-   For member profile:
    -   `h-12 w-12` or `h-16 w-16` on detail pages.

BADGE:

-   Small tag style:
    -   `inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600`
-   For roles (ADMIN, MEMBER, etc.) or visibility (PUBLIC, MEMBERS_ONLY, PRIVATE).

---

## TREE VIEW (FAMILY TREE)

-   General:
    -   Look more like a clean diagram than a flashy graph.
    -   Light backgrounds, simple lines, clear node boxes.

NODE:

-   Style:
    -   Small card:
        -   `rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm`
    -   Inside:
        -   Top: fullName (`text-sm font-semibold`)
        -   Middle: optional avatar + gender icon (subtle).
        -   Bottom: `text-xs text-slate-500` for generation / years of birth-death.

EDGES:

-   Thin lines, neutral color:
    -   #CBD5F5 or similar (blue-gray).
-   Avoid arrows unless necessary.

INTERACTION:

-   Pan/zoom using basic controls (no crazy animations).
-   Smooth transitions, but keep them subtle, not flashy.

---

## NAVIGATION & LAYOUT COMPONENTS

-   Header (top bar):
    -   Height ~56px.
    -   `border-b border-slate-200 bg-white px-4 flex items-center justify-between`
-   Sidebar (dashboard):
    -   `w-56 border-r border-slate-200 bg-slate-50`
    -   Nav items:
        -   `flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100`
        -   Active:
            -   `bg-slate-200 text-slate-900 font-medium`

---

## FEEL LIKE NOTION + VERCEL

-   NOTION influence:

    -   Lots of whitespace.
    -   Neutral colors.
    -   Simple typography.
    -   Subtle borders and divisions instead of heavy lines.

-   VERCEL DASHBOARD influence:
    -   Clean left sidebar.
    -   Clear cards with concise information.
    -   Simple, unobtrusive icons.
    -   Focus on content, not decoration.

---

## TECHNICAL

-   Use Tailwind CSS for all styling (no external CSS frameworks).
-   No heavy UI kits (e.g., no MUI, no Ant Design) unless I explicitly ask.
-   Components should be small, composable, and easy to reuse.
-   All pages should feel consistent with this style.

Generate all Admin Area pages using the FE requirements and the UI STYLE GUIDE above.

Pages required:

-   /admin (dashboard)
-   /admin/members
-   /admin/members/[id]
-   /admin/members/new
-   /admin/users
-   /admin/branches

Please generate:

-   folder structure
-   actual Next.js App Router files
-   React components
-   Tailwind styling based on the style guide
-   example API integration calls
-   mock data (if backend not ready)

Follow the UI STYLE GUIDE exactly.

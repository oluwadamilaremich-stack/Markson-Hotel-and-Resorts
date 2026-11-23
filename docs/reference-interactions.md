# Reference interactions (mariven.framer.website)

Studied on 2026-11-09 by scripting a browser through every page at 1440px and 390px wide.
The Figma file is the source for layout and copy; this file records how things **move**.

## Site-wide

| What | Behaviour | Status |
|---|---|---|
| Scroll-in reveal | Fade up once when entering view. Distances: eyebrow 10px, heading block 10px, button 20px, cards/content blocks 40px, list rows (FAQ, amenities) 20px staggered, testimonial slides in from the side (x 60px). | Done (`Reveal`, `SectionHeader`, `Accordion`) |
| Button hover | Label slides **up** and fades out while a copy rises from below and fades in (~300ms). Outline buttons also fade to a dark (`ink`) fill with light text. Light buttons (on photos) keep their colour. | Done (`button.tsx`) |
| Card hover | Blog cards: photo scales to 1.02. | Done |
| Photo heroes | Pinned (`position: sticky`); the next section slides over it like a curtain. Full screen height on phones. Used on Home, About, Rooms, Room details, Services, Events. | Home done; other pages in Phase 2 |
| Header (desktop) | Transparent over photo heroes, solid on light pages. Ours hides on scroll down and returns on scroll up (from the client's video). Blog list and 404 have no photo hero. | Done |
| Header (phone) | Logo centred, two-line menu icon on the right, no phone number. | Done |
| Phone menu | Full-screen cream panel, logo + thin ✕, six links centred in Playfair, appearing one after another. No Home link, no contact details. | Done |
| Footer | Monogram badge straddles the top border; palm shadows bottom corners. | Done |

## Home

- Welcome: letter pinned in the middle of the screen while 5 photos scroll past (they also drift ~360px); photos hidden below desktop. Done.
- Gallery: wheel/trackpad over it moves photos; one full-width photo on phones. Done.
- Stay your Way: hover highlights a name; click opens details and swaps the photo. Phones: single photo card with arrows/swipe. Done.
- Services: whole slide (photo + text) fades out, next fades in sliding from the side. Done.
- Events: rows pin and stack over each other on desktop. Done.

## Inner pages (Phase 2)

- **About**: pinned photo hero; intro block has 5 photos drifting ~360px around a centred paragraph (same idea as the home welcome); one block rises 100px; story and values reveal at 10px/40px.
- **Rooms**: pinned hero; cards reveal at 40px; card hover = name + specs slide up, "Starting at ₦X / night" fades in, bottom gradient deepens (client video).
- **Room details**: pinned hero; amenities reveal one by one (20px stagger); photo slider; policies + FAQ accordions; "More Rooms" cards with the same hover.
- **Services / Events**: pinned hero; services alternate image/text rows (40px reveals); events reuse the stacking rows.
- **Blog list / Article / Contact / Privacy / 404**: no photo hero; header solid. Contact form + FAQ reveal at 10/20/40px.
- **Privacy Policy** (not in Figma): centred title, "Effective Date", numbered sections with thin dividers, bullet lists.
- **404** (not in Figma): "Lost in the Tides?", one line of copy, "Back to Home" button, footer.

## Open questions for the client

- The reference hero is an autoplaying looping **video**; Markson's Figma uses a still photo. Use a video if the hotel can supply one.
- The reference shows a small **Tripadvisor rating badge** in the hero corner. Add only if Markson has a real rating.

# Stash Tracker 📦

An inventory management mobile app for property managers, hobbyists, and anyone who loses track of their stuff.

> "I'm always buying things I already have but because I don't have a way to know what I have I waste money and time" — Robel, the guy who inspired this

## Features

### Core Inventory Management
- **Search, browse, scroll, view, update, delete** inventory items
- **Statistics dashboard** — see totals, tag distributions, value summaries
- **Multi-select** for bulk tagging and operations

### Tags & Grouping
- Items can have multiple tags (e.g., "hardware", "plumbing", "kitchen")
- Tags drive **border colors** in multi-item views for visual distinction
- Sort and group items by tag, type, location, or custom criteria

### Attachments
- Store images, PDFs, receipts, or any file type
- **Open in-app** or launch external viewers for unsupported types
- **AI Detection**: Send attachments to LLM for auto-tagging and property extraction

### Properties (Key/Value/Unit)
- Generic property system: `key`, `value`, `unit` (unit is optional)
- Smart suggestions based on tag frequency — if "hardware" items often have "size", it shows up first
- Examples: quantity, value, purchase date, warranty expiry

### Quick Capture
- **Gallery** or **Camera** entry
- **Crop tool**: Draw a circle around an area → auto-crops to bounding rectangle
- Streamlined "new item" flow prioritizing tags first

### Settings
- Font size adjustment
- Dark/Light mode
- Left/Right handed mode
- Backup to local (compressed) or cloud (Google Drive, PostgreSQL, MongoDB)

## Screens (Planned)

1. **Home/Dashboard** — Statistics, recent items, quick actions
2. **Items List** — Scrollable, filterable, searchable inventory
3. **Item Detail** — Full view with properties, tags, attachments
4. **Camera/Gallery** — Capture with crop tool
5. **Item Editor** — Add/edit properties, tags, attachments
6. **AI Detection** — Review auto-suggested tags/properties
7. **Search** — Global search with filters
8. **Settings** — Font, theme, handedness, backups
9. **Help** — How-to guide

## Tech Stack

- **React Native** (latest)
- **Ignite** framework (boilerplate + CLI)
- **Local database** (SQLite via WatermelonDB or similar)
- **Edge LLM integration** for AI tagging (investigation needed)
- iOS + Android support

## Architecture Notes

- Offline-first: local DB, no startup wait for data
- Consistent UI: reusable components, design tokens for colors/sizes
- Gesture-driven + button-driven for accessibility
- Backup system: local ZIP export + cloud sync options

## Getting Started

```bash
# TBD once we initialize the Ignite project
npm install
npx ignite-cli run
```

## Contributing

Repo: https://github.com/c3p0talksalot-ai/stash-tracker

Collaborators: @anwarhamr (owner)

## Roadmap

- [ ] Finish requirements doc
- [ ] Data model design
- [ ] Screen mockups (images)
- [ ] Investigate Edge LLM options
- [ ] Initialize Ignite project
- [ ] Set up CI/CD pipeline
- [ ] Implement core CRUD
- [ ] Implement tags system
- [ ] Implement camera/crop flow
- [ ] Implement AI detection
- [ ] Implement backup system
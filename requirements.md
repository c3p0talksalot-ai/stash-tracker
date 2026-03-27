# Stash Tracker — Requirements

## 1. Overview

**Purpose:** Mobile inventory management for people who lose track of their stuff (property managers, hobbyists, DIYers).

**Target Users:** Property managers, RC enthusiasts, DIYers, anyone with lots of small parts.

**Platforms:** iOS + Android (React Native)

---

## 2. User Stories

### 2.1 Core Inventory
- As a user, I can add an item by taking a photo or selecting from gallery
- As a user, I can manually create an item with properties
- As a user, I can search for items by name, tag, or property
- As a user, I can scroll through all items with infinite scroll
- As a user, I can view item details (photo, properties, tags, attachments)
- As a user, I can update any item property
- As a user, I can delete an item (with confirmation)

### 2.2 Tags & Organization
- As a user, I can assign multiple tags to an item
- As a user, I can create new tags
- As a user, I can see tags sorted by frequency for smart suggestions
- As a user, I can filter items by tag
- As a user, I can see items grouped by tag with colored borders

### 2.3 Properties
- As a user, I can add key/value/unit properties to an item
- As a user, I can edit or delete properties
- As a user, I see smart property suggestions based on tag history
- As a user, I can select from a pre-defined units list

### 2.4 Attachments
- As a user, I can add multiple attachments (images, PDFs, docs) to an item
- As a user, I can view attachments in-app or launch external app
- As a user, I can delete attachments (with confirmation)
- As a user, I can run "AI Detect" on an attachment to auto-suggest tags/properties

### 2.5 Camera Flow
- As a user, I can take a photo with full camera controls
- As a user, I can crop by drawing a circle, which auto-crops to bounding rectangle
- As a user, I can accept or reject the crop
- As a user, I can save the cropped image as a new item

### 2.6 Statistics
- As a user, I can see total item count
- As a user, I can see tag distribution (pie/bar chart)
- As a user, I can see total estimated value
- As a user, I can see items added over time (timeline)

### 2.7 Settings
- As a user, I can adjust font size
- As a user, I can toggle dark/light mode
- As a user, I can set left/right handed mode
- As a user, I can export backup (compressed local file)
- As a user, I can import backup
- As a user, I can connect to cloud backup (Google Drive, etc.)

### 2.8 Help
- As a user, I can read a help screen explaining all features
- As a user, I can see tooltips on first launch

---

## 3. Data Model

### 3.1 Item
```typescript
interface Item {
  id: string;              // UUID
  name: string;            // User-defined name
  createdAt: number;       // Unix timestamp
  updatedAt: number;       // Unix timestamp
  tags: string[];          // Tag IDs
  properties: Property[];  // Inline key/value/unit
  attachments: Attachment[]; // File refs
  thumbnailUri?: string;   // For list view
}
```

### 3.2 Property
```typescript
interface Property {
  id: string;
  key: string;       // e.g., "size", "color", "qty"
  value: string | number | null;
  unit?: string;     // e.g., "inches", "gallons"
}
```

### 3.3 Attachment
```typescript
interface Attachment {
  id: string;
  uri: string;       // Local file path
  mimeType: string;  // image/jpeg, application/pdf, etc.
  filename: string;
  size: number;
  createdAt: number;
}
```

### 3.4 Tag
```typescript
interface Tag {
  id: string;
  name: string;      // e.g., "hardware", "plumbing"
  color?: string;    // Hex color for border
  usageCount: number; // For sorting suggestions
}
```

### 3.5 UserSettings
```typescript
interface UserSettings {
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'system';
  handedness: 'left' | 'right';
  backupEnabled: boolean;
  backupProvider?: 'local' | 'gdrive';
}
```

---

## 4. Smart Suggestions Algorithm

When adding tags to a new item:
1. User selects tags first
2. For each tag, query existing items with that tag
3. Collect all property keys used across those items
4. Sort keys by frequency (descending)
5. Display suggested properties in that order

Example:
- 300 "hardware" items, 280 have "size", 200 have "color", 50 have "weight"
- When user tags new item as "hardware", show: size → color → weight → [other]

---

## 5. AI Detection Flow

1. User taps "Detect" on an attachment
2. App sends attachment to LLM (local or API)
3. LLM returns suggested:
   - Tags (e.g., "electrical", "hardware")
   - Properties (e.g., { key: "voltage", value: "12V" })
4. Display results as approve/reject list
5. User reviews and accepts/rejects each suggestion
6. Accepted suggestions applied to item

**Edge LLM Options to Investigate:**
- llama.cpp on-device (heavy but free)
- Ollama API (local server)
- OpenAI API fallback (cloud)
- Claude API fallback

---

## 6. UI/UX Requirements

### 6.1 Design System
- **Colors**: Consistent palette (primary, secondary, surface, error)
- **Typography**: 3 sizes (small, medium, large) controlled by setting
- **Spacing**: 4px baseline grid (4, 8, 12, 16, 24, 32...)
- **Border radius**: Consistent (4px buttons, 8px cards, 12px modals)

### 6.2 Layout
- Bottom navigation for main sections (Home, Items, Search, Settings)
- Pull-to-refresh on list views
- Infinite scroll with loading indicators
- Responsive: works on phones + tablets

### 6.3 Gestures
- Swipe to delete (with undo)
- Long-press for multi-select
- Pull-down for quick actions
- Pinch to zoom on images

### 6.4 Accessibility
- Left/Right handed mode flips action buttons
- VoiceOver/TalkBack support
- Minimum touch target 44x44pt

---

## 7. Technical Requirements

### 7.1 Framework
- React Native (latest stable)
- Ignite CLI for project setup + boilerplate
- TypeScript

### 7.2 Database
- SQLite (WatermelonDB or expo-sqlite)
- Offline-first architecture
- Migrations support

### 7.3 State Management
- React Context or Zustand for global state
- Local component state for UI

### 7.4 Image Handling
- react-native-camera or expo-camera
- react-native-image-crop-picker or custom crop
- Local file storage (not cloud)

### 7.5 Backup
- Export: Zip all SQLite DB + attachments
- Import: Unzip and replace
- Cloud sync: Google Drive API (via gog)

### 7.6 Build
- GitHub Actions for CI/CD
- Android: Fastlane + Google Play
- iOS: Fastlane + TestFlight/App Store

---

## 8. Screen Inventory

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Splash | App launch, logo |
| 2 | Home/Dashboard | Stats, recent items, quick add |
| 3 | Items List | Scrollable all items, filter by tag |
| 4 | Item Detail | Full view, edit, attachments |
| 5 | Item Editor | Add/edit item properties |
| 6 | Camera | Capture photo |
| 7 | Crop Tool | Draw circle → crop |
| 8 | Gallery Picker | Select existing photo |
| 9 | Search | Global search with filters |
| 10 | AI Detection | Review LLM suggestions |
| 11 | Settings | Font, theme, handedness, backup |
| 12 | Help | User guide |

---

## 9. Out of Scope (v1)

- User authentication (local-only app)
- Multi-device sync (v2)
- Barcode/QR scanning (future)
- Cloud database (v2)
- In-app purchases

---

## 10. Open Questions

1. **Units**: Should we have a global units preference (imperial/metric)?
2. **Offline AI**: Should we bundle a small model or always use API?
3. **Backup frequency**: Auto-backup daily? Manual only?
4. **Max attachments per item**: Limit to 10? Unlimited?
5. **Search**: Server-side search for large datasets, or local SQLite FTS?

---

*Last updated: 2026-03-27*
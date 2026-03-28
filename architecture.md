# Stash Tracker — Architecture

> Initial architectural thinking. Subject to change.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  Home   │  │  Items  │  │ Search  │  │Settings │       │
│  │Screen   │  │ Screen  │  │ Screen  │  │ Screen  │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │            │            │
│  ┌────┴────────────┴────────────┴────────────┴────┐        │
│  │              React Context / Zustand           │        │
│  │         (Global State: items, tags, settings)  │        │
│  └─────────────────────┬───────────────────────────┘        │
│                        │                                    │
│  ┌────────────────────┴───────────────────────────┐        │
│  │              Data Access Layer                  │        │
│  │      (WatermelonDB / SQLite Repository)        │        │
│  └─────────────────────┬───────────────────────────┘        │
│                        │                                    │
│  ┌────────────────────┴───────────────────────────┐        │
│  │               Local Storage                    │        │
│  │         (SQLite + File System for images)      │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (optional, v2)
┌─────────────────────────────────────────────────────────────┐
│                      Cloud Services                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │Google    │  │PostgreSQL│  │  LLM API │                   │
│  │Drive     │  │  (cloud) │  │(OpenAI/  │                   │
│  │(backup)  │  │ (sync)   │  │ Claude)  │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure (Ignite Standard)

```
stash-tracker/
├── app/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── TagChip.tsx
│   │   ├── PropertyRow.tsx
│   │   └── ...
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── ItemsListScreen.tsx
│   │   ├── ItemDetailScreen.tsx
│   │   ├── ItemEditorScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── CropScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── TagsScreen.tsx         # Tag management
│   │   └── HelpScreen.tsx
│   ├── navigation/        # React Navigation setup
│   │   └── AppNavigator.tsx
│   ├── hooks/             # Custom hooks
│   │   ├── useItems.ts
│   │   ├── useTags.ts
│   │   ├── useSettings.ts
│   │   └── useAIDetection.ts
│   ├── services/          # External integrations
│   │   ├── database.ts    # WatermelonDB setup
│   │   ├── storage.ts     # File system ops
│   │   ├── llm.ts         # LLM API client
│   │   ├── backup.ts      # Export/import logic
│   │   └── cloudSync.ts   # Google Drive, etc.
│   ├── database/          # WatermelonDB
│   │   ├── schema.ts      # Database schema
│   │   ├── index.ts       # DB initialization
│   │   └── models/        # Model classes
│   │       ├── Item.ts
│   │       ├── Property.ts
│   │       ├── Attachment.ts
│   │       ├── AttachmentMetadata.ts
│   │       ├── Tag.ts
│   │       ├── ItemTag.ts
│   │       └── Setting.ts
│   ├── theme/             # Design tokens
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── utils/             # Helpers
│   │   ├── suggestions.ts  # Smart property suggestions
│   │   ├── tagUtils.ts     # Tag dedup & similarity
│   │   ├── constants.ts
│   │   └── ...
│   └── App.tsx            # Root component
├── android/               # Android native code
├── ios/                   # iOS native code
├── test/                  # Test files
├── index.js               # Entry point
├── app.config.ts          # Expo/Ignite config
└── package.json
```

---

## 3. Database Schema (WatermelonDB)

### 3.1 Tables

| Table | Description |
|-------|-------------|
| `items` | Core inventory items (name required, others optional) |
| `properties` | Key/value/unit for items |
| `attachments` | Files attached to items |
| `attachment_metadata` | Key-value metadata for attachments |
| `tags` | User-defined tags with dedup support |
| `item_tags` | Many-to-many join table |
| `settings` | User preferences |

### 3.2 Schema Details

**items**
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| name | string | ✓ | Always required |
| description | string | | Optional |
| location | string | | Optional |
| purchase_date | number | | Unix timestamp |
| purchase_price | number | | In cents |
| created_at | number | | Unix timestamp |
| updated_at | number | | Unix timestamp |

**properties**
| Column | Type | Notes |
|--------|------|-------|
| item_id | string | Foreign key, indexed |
| key | string | Property name |
| value | string | Property value |
| unit | string | Optional (e.g., "kg", "in") |
| created_at | number | |
| updated_at | number | |

**attachments**
| Column | Type | Notes |
|--------|------|-------|
| item_id | string | Foreign key, indexed |
| file_uri | string | Local file path |
| mime_type | string | e.g., "image/jpeg" |
| file_size | number | In bytes |
| thumbnail_uri | string | Optional |
| original_filename | string | Original file name |
| alt_text | string | Accessibility text |
| created_at | number | |
| updated_at | number | |

**attachment_metadata**
| Column | Type | Notes |
|--------|------|-------|
| attachment_id | string | Foreign key, indexed |
| key | string | Metadata key |
| value | string | Metadata value |
| created_at | number | |
| updated_at | number | |

**tags**
| Column | Type | Notes |
|--------|------|-------|
| name | string | Display name |
| normalized_name | string | Lowercase, trimmed (for dedup) |
| slug | string | URL-safe identifier |
| color | string | Optional hex color |
| usage_count | number | Denormalized count |
| created_at | number | |
| updated_at | number | |

### 3.3 Relationships

```
Item 1 ──► Property (one-to-many)
Item 1 ──► Attachment (one-to-many)
  Attachment 1 ──► AttachmentMetadata (one-to-many)
Item N ◄──► Tag (many-to-many via item_tags)
```

### 3.4 Indexes

- `items.name` — for search
- `items.created_at` — for sorting
- `items.location` — for filtering
- `tags.normalized_name` — for dedup lookups
- `tags.slug` — for lookups
- `tags.usage_count` — for sorting
- `properties.item_id` + `properties.key` — for suggestions
- `attachments.item_id` — for fetching item attachments
- `attachment_metadata.attachment_id` — for fetching attachment metadata

---

## 4. Tag Dedup Strategy

### 4.1 Normalization Rules
- Trim whitespace: `" electronics "` → `"electronics"`
- Lowercase: `"ELECTRONICS"` → `"electronics"`
- Slugify: `"USB Cables"` → `"usb-cables"`

### 4.2 On Tag Creation
1. Normalize input name
2. Query for existing tag with same `normalized_name`
3. If found → reuse existing tag (increment `usage_count`)
4. If not found → create new tag with normalized name + slug

### 4.3 Similarity Detection
- Use string-similarity library (Dice coefficient)
- When adding tags, show warning for similar existing tags (>80% match)
- Tag management screen: bulk merge/rename/delete

### 4.4 Tag Management Screen Features
- View all tags (paginated, sorted by usage_count)
- Search/filter tags
- Merge tags (redirect all item associations to target)
- Rename tags (update name + normalized_name + slug)
- Delete tags (with confirmation if usage_count > 0)

---

## 5. State Management

### 5.1 Chosen: Zustand

After evaluating options (React Context, MobX, Redux Toolkit, Jotai), we chose **Zustand**:
- Tiny (~1KB), minimal bundle size
- Simple API, low learning curve
- Works great with MMKV for persistence
- Ignite-compatible (just add zustand + zustand-persist)

### 5.2 Global State (Zustand Store)

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV({ id: 'stash-tracker' })

interface AppState {
  // Items
  items: Item[];
  loadItems: () => Promise<void>;
  addItem: (item: Item) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // Tags
  tags: Tag[];
  loadTags: () => Promise<void>;
  addTag: (tag: Tag) => Promise<void>;

  // Settings
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;

  // UI State
  selectedItems: string[];  // For multi-select
  isLoading: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'stash-tracker-store',
      storage: createJSONStorage(() => storage),
    }
  )
)
```

**Note:** We can still use React Context for specific needs (e.g., ThemeContext) while using Zustand for global app state.

### 5.3 Local State

- Form inputs (React useState)
- Modal visibility
- Camera state
- Scroll position (react-native's useScrollOffset)

---

## 6. Key Modules

### 6.1 Database Service (`services/database.ts`)

```typescript
class DatabaseService {
  async initialize(): Promise<void>;
  async getItems(filters?: ItemFilters): Promise<Item[]>;
  async getItem(id: string): Promise<Item>;
  async createItem(data: CreateItemDTO): Promise<Item>;
  async updateItem(id: string, data: UpdateItemDTO): Promise<Item>;
  async deleteItem(id: string): Promise<void>;

  // Tags
  async getTags(): Promise<Tag[]>;
  async findOrCreateTag(name: string, color?: string): Promise<Tag>;
  async findSimilarTags(name: string, threshold?: number): Promise<Tag[]>;
  async mergeTags(sourceTagId: string, targetTagId: string): Promise<void>;
  async deleteTag(id: string): Promise<void>;

  // Suggestions
  async getSuggestedProperties(tagIds: string[]): Promise<string[]>;
}
```

### 6.2 Storage Service (`services/storage.ts`)

```typescript
class StorageService {
  async saveAttachment(uri: string, mimeType: string): Promise<StoredFile>;
  async deleteAttachment(id: string): Promise<void>;
  async getAttachmentUri(id: string): Promise<string>;
  async getAttachmentsDir(): string;
}
```

### 6.3 LLM Service (`services/llm.ts`)

```typescript
class LLMService {
  async detectAttachment(attachment: Attachment): Promise<DetectionResult>;

  // Configuration
  setProvider(provider: 'local' | 'openai' | 'claude'): void;
  setLocalEndpoint(endpoint: string): void;  // Ollama, etc.
}

interface DetectionResult {
  suggestedTags: string[];
  suggestedProperties: { key: string; value: string }[];
  confidence: number;
}
```

### 6.4 Backup Service (`services/backup.ts`)

```typescript
class BackupService {
  async createLocalBackup(): Promise<string>;  // Returns file path
  async restoreLocalBackup(filePath: string): Promise<void>;

  async exportToGoogleDrive(): Promise<string>;  // Returns drive file ID
  async importFromGoogleDrive(driveFileId: string): Promise<void>;
}
```

---

## 7. Smart Suggestions Algorithm

```typescript
async function getSuggestedProperties(tagIds: string[]): Promise<PropertySuggestion[]> {
  // 1. Get all items with these tags
  const items = await db.items.findMany({
    where: { tags: { hasSome: tagIds } }
  });

  // 2. Collect all property keys and count frequency
  const keyFrequency = new Map<string, number>();
  for (const item of items) {
    for (const prop of item.properties) {
      const count = keyFrequency.get(prop.key) || 0;
      keyFrequency.set(prop.key, count + 1);
    }
  }

  // 3. Sort by frequency descending
  return Array.from(keyFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, frequency: count }));
}
```

---

## 8. AI Detection Flow

```
User taps "Detect" on attachment
         │
         ▼
┌─────────────────┐
│  Prepare image  │
│  (resize/compress)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Call LLM API   │
│  (local/cloud)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse response │
│  (tags + props) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Show approve/ │
│  reject list   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Apply accepted │
│  to item        │
└─────────────────┘
```

### Prompt Template

```
Analyze this inventory item image.

Return JSON:
{
  "tags": ["tag1", "tag2"],
  "properties": [
    {"key": "color", "value": "red"},
    {"key": "size", "value": "large"}
  ],
  "confidence": 0.85
}
```

---

## 9. Camera & Crop Flow

### 9.1 Camera
- Use `expo-camera` or `react-native-camera`
- Full controls: flash, zoom, focus, front/back
- On capture → navigate to CropScreen

### 9.2 Crop Tool
- User draws a circle on the image
- On gesture end:
  - Calculate bounding rectangle
  - Crop image to that rectangle
  - Show preview with Accept/Reject buttons
- Accept → save cropped image → navigate to ItemEditor
- Reject → return to original image → allow re-crop

---

## 10. Backup Strategy

### 10.1 Local Backup
1. Export SQLite database to JSON
2. Copy all attachment files to temp dir
3. Zip everything (DB JSON + attachments)
4. Save to app's documents directory
5. User can share via system share sheet

### 10.2 Restore
1. User selects backup zip
2. Unzip to temp
3. Replace SQLite DB file
4. Copy attachment files to correct location
5. Reload app state

### 10.3 Cloud (Future)
- Google Drive via gog CLI
- PostgreSQL sync (cloud DB)
- MongoDB sync (cloud DB)

---

## 11. CI/CD Pipeline

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm test

  android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
      - uses: android-actions/setup-android@v1
      - run: cd android && ./gradlew assembleRelease

  ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd ios && pod install
      - run: xcodebuild -workspace ios/StashTracker.xcworkspace -scheme StashTracker -configuration Release build
```

---

## 12. Recommended Libraries

### 12.1 Already Installed
- `@nozbe/watermelondb` — SQLite ORM
- `@nozbe/with-observables` — React bindings for WatermelonDB
- `zustand` — State management
- `react-native-mmkv` — Fast key-value storage
- `react-native-reanimated` — Animations
- `react-native-gesture-handler` — Gestures
- `expo-camera` / `expo-image-picker` — Camera/gallery
- `apisauce` — HTTP client

### 12.2 To Install
```bash
npm install string-similarity fuse.js
# OR
yarn add string-similarity fuse.js
```

| Library | Purpose | Use Case |
|---------|---------|----------|
| `string-similarity` | Dice coefficient | Tag duplicate detection |
| `fuse.js` | Fuzzy search | Inline tag suggestions |

---

## 13. Open Architectural Decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| DB | WatermelonDB vs expo-sqlite | WatermelonDB (better sync support) |
| State | React Context vs MobX vs Redux vs Zustand vs Jotai | **Zustand** (simple, lightweight, MMKV-compatible) |
| LLM | On-device vs API | API for v1, investigate on-device for v2 |
| Navigation | React Navigation | React Navigation (standard) |
| Forms | React Hook Form vs plain | React Hook Form |
| Images | expo-image vs react-native-fast-image | expo-image |
| Tag dedup | None vs app logic vs database constraints | **App logic** with normalized_name column |
| Fuzzy search | fuse.js | For inline tag suggestions |
| String similarity | string-similarity (Dice coefficient) | For duplicate detection (>80% match threshold) |

---

## 14. Next Steps

1. ~~Initialize Ignite project~~
2. ~~Set up WatermelonDB schema~~ ← We are here
3. Implement database service layer
4. Build tag management screen
5. Implement basic CRUD
6. Build camera flow
7. Integrate LLM API
8. Add backup system

---

*This document is a living artifact. Update as we learn.*
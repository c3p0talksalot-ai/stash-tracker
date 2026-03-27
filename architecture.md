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
│   ├── models/            # Data models (WatermelonDB)
│   │   ├── Item.ts
│   │   ├── Property.ts
│   │   ├── Attachment.ts
│   │   ├── Tag.ts
│   │   └── Setting.ts
│   ├── theme/             # Design tokens
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── utils/             # Helpers
│   │   ├── suggestions.ts  # Smart property suggestions
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
| `items` | Core inventory items |
| `properties` | Key/value/unit for items |
| `attachments` | Files attached to items |
| `tags` | User-defined tags |
| `item_tags` | Many-to-many join table |
| `settings` | User preferences |

### 3.2 Relationships

```
Item 1 ──► Property (one-to-many)
Item 1 ──► Attachment (one-to-many)
Item N ◄──► Tag (many-to-many via item_tags)
```

### 3.3 Indexes

- `items.name` — for search
- `items.created_at` — for sorting
- `tags.name` — for lookup
- `properties.key` + `properties.item_id` — for suggestions

---

## 4. State Management

### 4.1 Global State (Zustand)

```typescript
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
```

### 4.2 Local State

- Form inputs (React useState)
- Modal visibility
- Camera state
- Scroll position (react-native's useScrollOffset)

---

## 5. Key Modules

### 5.1 Database Service (`services/database.ts`)

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
  async createTag(name: string, color?: string): Promise<Tag>;

  // Suggestions
  async getSuggestedProperties(tagIds: string[]): Promise<string[]>;
}
```

### 5.2 Storage Service (`services/storage.ts`)

```typescript
class StorageService {
  async saveAttachment(uri: string, mimeType: string): Promise<StoredFile>;
  async deleteAttachment(id: string): Promise<void>;
  async getAttachmentUri(id: string): Promise<string>;
  async getAttachmentsDir(): string;
}
```

### 5.3 LLM Service (`services/llm.ts`)

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

### 5.4 Backup Service (`services/backup.ts`)

```typescript
class BackupService {
  async createLocalBackup(): Promise<string>;  // Returns file path
  async restoreLocalBackup(filePath: string): Promise<void>;

  async exportToGoogleDrive(): Promise<string>;  // Returns drive file ID
  async importFromGoogleDrive(driveFileId: string): Promise<void>;
}
```

---

## 6. Smart Suggestions Algorithm

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

## 7. AI Detection Flow

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

## 8. Camera & Crop Flow

### 8.1 Camera
- Use `expo-camera` or `react-native-camera`
- Full controls: flash, zoom, focus, front/back
- On capture → navigate to CropScreen

### 8.2 Crop Tool
- User draws a circle on the image
- On gesture end:
  - Calculate bounding rectangle
  - Crop image to that rectangle
  - Show preview with Accept/Reject buttons
- Accept → save cropped image → navigate to ItemEditor
- Reject → return to original image → allow re-crop

---

## 9. Backup Strategy

### 9.1 Local Backup
1. Export SQLite database to JSON
2. Copy all attachment files to temp dir
3. Zip everything (DB JSON + attachments)
4. Save to app's documents directory
5. User can share via system share sheet

### 9.2 Restore
1. User selects backup zip
2. Unzip to temp
3. Replace SQLite DB file
4. Copy attachment files to correct location
5. Reload app state

### 9.3 Cloud (Future)
- Google Drive via gog CLI
- PostgreSQL sync (cloud DB)
- MongoDB sync (cloud DB)

---

## 10. CI/CD Pipeline

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

## 11. Open Architectural Decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| DB | WatermelonDB vs expo-sqlite | WatermelonDB (better sync support) |
| State | Redux vs Context vs Zustand | Zustand (simpler) |
| LLM | On-device vs API | API for v1, investigate on-device for v2 |
| Navigation | React Navigation | React Navigation (standard) |
| Forms | React Hook Form vs plain | React Hook Form |
| Images | expo-image vs react-native-fast-image | expo-image |

---

## 12. Next Steps

1. Initialize Ignite project
2. Set up WatermelonDB schema
3. Implement basic CRUD
4. Build camera flow
5. Integrate LLM API
6. Add backup system

---

*This document is a living artifact. Update as we learn.*
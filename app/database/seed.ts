import { database, Tag, Item, ItemTag } from './index';
import { Q } from '@nozbe/watermelondb';

export interface PreseedTag {
  name: string;
  slug: string;
  color: string;
}

export const PRESEED_TAGS: Record<string, PreseedTag[]> = {
  'inventory-tracking': [
    { name: 'In Stock', slug: 'in-stock', color: '#22c55e' },
    { name: 'Low Stock', slug: 'low-stock', color: '#eab308' },
    { name: 'Out of Stock', slug: 'out-of-stock', color: '#ef4444' },
    { name: 'Reorder', slug: 'reorder', color: '#f97316' },
    { name: 'Received', slug: 'received', color: '#3b82f6' },
    { name: 'Shipped', slug: 'shipped', color: '#8b5cf6' },
    { name: 'Reserved', slug: 'reserved', color: '#ec4899' },
    { name: 'Damaged', slug: 'damaged', color: '#dc2626' },
    { name: 'Returned', slug: 'returned', color: '#6366f1' },
    { name: 'Location: Warehouse', slug: 'location-warehouse', color: '#64748b' },
    { name: 'Location: Shelf', slug: 'location-shelf', color: '#94a3b8' },
    { name: 'Location: Bin', slug: 'location-bin', color: '#cbd5e1' },
  ],
};

export interface PreseedItem {
  name: string;
  description?: string;
  location?: string;
  purchasePrice?: number;
  tagSlugs: string[];
}

export const PRESEED_ITEMS: Record<string, PreseedItem[]> = {
  'inventory-tracking': [
    { name: 'Arduino Uno R3', description: 'Microcontroller board', location: 'Shelf A1', tagSlugs: ['in-stock', 'location-shelf'] },
    { name: 'Raspberry Pi 4B', description: 'Single-board computer', location: 'Shelf A2', tagSlugs: ['in-stock', 'location-shelf'] },
    { name: 'ESP32 DevKit', description: 'WiFi + BLE microcontroller', location: 'Bin B1', tagSlugs: ['low-stock', 'location-bin'] },
    { name: 'USB-C Cable 6ft', description: 'Charging cable', location: 'Warehouse', tagSlugs: ['in-stock', 'location-warehouse'] },
    { name: 'HDMI Cable 3ft', description: 'Display cable', location: 'Warehouse', tagSlugs: ['out-of-stock', 'location-warehouse'] },
    { name: 'LED Strip 5m', description: 'RGB LED strip', location: 'Shelf B3', tagSlugs: ['in-stock', 'location-shelf'] },
    { name: 'Soldering Iron', description: '60W soldering iron', location: 'Bin C2', tagSlugs: ['reserved', 'location-bin'] },
    { name: 'Multimeter', description: 'Digital multimeter', location: 'Shelf C1', tagSlugs: ['in-stock', 'location-shelf'] },
    { name: 'Breadboard', description: '400-tie breadboard', location: 'Bin A3', tagSlugs: ['in-stock', 'location-bin'] },
    { name: 'Jumper Wires', description: 'M/M, M/F, F/F kit', location: 'Bin A4', tagSlugs: ['low-stock', 'location-bin'] },
    { name: 'Capacitor Kit', description: '100pcs electrolytic', location: 'Shelf D1', tagSlugs: ['in-stock', 'location-shelf'] },
    { name: 'Resistor Kit', description: '1/4W resistor assortment', location: 'Shelf D2', tagSlugs: ['in-stock', 'location-shelf'] },
  ],
};

export async function seedTags(useCase: string = 'inventory-tracking'): Promise<void> {
  const tagsCollection = database.get<Tag>('tags');
  const tagsToSeed = PRESEED_TAGS[useCase] || [];

  await database.write(async () => {
    for (const tagData of tagsToSeed) {
      // Check if tag already exists
      const existing = await tagsCollection
        .query(Q.where('slug', tagData.slug))
        .fetch();

      if (existing.length === 0) {
        await tagsCollection.create((tag) => {
          tag.name = tagData.name;
          tag.normalizedName = tagData.name.trim().toLowerCase();
          tag.slug = tagData.slug;
          tag.color = tagData.color;
          tag.usageCount = 0;
          tag.isPreseeded = true;
        });
      }
    }
  });
}

export async function seedItems(useCase: string = 'inventory-tracking'): Promise<void> {
  const itemsCollection = database.get<Item>('items');
  const tagsCollection = database.get<Tag>('tags');
  const itemTagsCollection = database.get<ItemTag>('item_tags');
  const itemsToSeed = PRESEED_ITEMS[useCase] || [];

  await database.write(async () => {
    for (const itemData of itemsToSeed) {
      // Check if item already exists
      const existing = await itemsCollection
        .query(Q.where('name', itemData.name))
        .fetch();

      if (existing.length === 0) {
        const newItem = await itemsCollection.create((item) => {
          item.name = itemData.name;
          item.description = itemData.description || '';
          item.location = itemData.location || '';
          item.purchasePrice = itemData.purchasePrice || 0;
        });

        // Attach tags
        for (const slug of itemData.tagSlugs) {
          const tags = await tagsCollection.query(Q.where('slug', slug)).fetch();
          if (tags.length > 0) {
            await itemTagsCollection.create((it) => {
              it.itemId = newItem.id;
              it.tagId = tags[0].id;
            });
            // Increment tag usage
            await tags[0].update((t) => {
              t.usageCount = t.usageCount + 1;
            });
          }
        }
      }
    }
  });
}

export async function getPreseededTags(): Promise<Tag[]> {
  const tagsCollection = database.get<Tag>('tags');
  return tagsCollection.query(Q.where('is_preseeded', true)).fetch();
}
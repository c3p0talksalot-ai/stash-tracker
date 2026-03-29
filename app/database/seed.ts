import { database, Tag } from './index';
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

export async function getPreseededTags(): Promise<Tag[]> {
  const tagsCollection = database.get<Tag>('tags');
  return tagsCollection.query(Q.where('is_preseeded', true)).fetch();
}
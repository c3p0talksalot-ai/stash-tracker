import { Q } from '@nozbe/watermelondb';
import { database, Item, Property, Attachment, AttachmentMetadata, Tag, ItemTag, Setting } from '../database';

// Types for DTOs
export interface CreateItemDTO {
  name: string;
  description?: string;
  location?: string;
  purchaseDate?: number;
  purchasePrice?: number;
}

export interface UpdateItemDTO {
  name?: string;
  description?: string;
  location?: string;
  purchaseDate?: number;
  purchasePrice?: number;
}

export interface ItemFilters {
  search?: string;
  tagIds?: string[];
  location?: string;
}

export interface CreatePropertyDTO {
  itemId: string;
  key: string;
  value: string;
  unit?: string;
}

export interface CreateAttachmentDTO {
  itemId: string;
  fileUri: string;
  mimeType: string;
  fileSize?: number;
  originalFilename?: string;
  altText?: string;
}

export interface CreateAttachmentMetadataDTO {
  attachmentId: string;
  key: string;
  value: string;
}

export interface CreateTagDTO {
  name: string;
  color?: string;
}

export interface TagFilters {
  search?: string;
  minUsageCount?: number;
  sortBy?: 'name' | 'usage_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PropertySuggestion {
  key: string;
  frequency: number;
}

// Database Service
class DatabaseService {
  private itemsCollection = database.get<Item>('items');
  private propertiesCollection = database.get<Property>('properties');
  private attachmentsCollection = database.get<Attachment>('attachments');
  private attachmentMetadataCollection = database.get<AttachmentMetadata>('attachment_metadata');
  private tagsCollection = database.get<Tag>('tags');
  private itemTagsCollection = database.get<ItemTag>('item_tags');
  private settingsCollection = database.get<Setting>('settings');

  // ========== ITEMS ==========

  async getItems(filters?: ItemFilters): Promise<Item[]> {
    let query = this.itemsCollection.query();

    if (filters?.search) {
      query = this.itemsCollection.query(
        Q.where('name', Q.like(`%${Q.sanitizeLikeString(filters.search)}%`))
      );
    }

    const items = await query.fetch();

    // If filtering by tags, we need to filter in memory
    if (filters?.tagIds && filters.tagIds.length > 0) {
      const filtered: Item[] = [];
      for (const item of items) {
        const itemTags = await this.getItemTagIds(item.id);
        if (filters.tagIds.some((tagId) => itemTags.includes(tagId))) {
          filtered.push(item);
        }
      }
      return filtered;
    }

    // Filter by location
    if (filters?.location) {
      return items.filter((item) => item.location === filters.location);
    }

    return items;
  }

  async getItem(id: string): Promise<Item | null> {
    try {
      return await this.itemsCollection.find(id);
    } catch {
      return null;
    }
  }

  async createItem(data: CreateItemDTO): Promise<Item> {
    return database.write(async () => {
      return this.itemsCollection.create((item) => {
        item.name = data.name;
        item.description = data.description;
        item.location = data.location;
        item.purchaseDate = data.purchaseDate;
        item.purchasePrice = data.purchasePrice;
      });
    });
  }

  async updateItem(id: string, data: UpdateItemDTO): Promise<Item | null> {
    const item = await this.getItem(id);
    if (!item) return null;

    return database.write(async () => {
      return item.update((i) => {
        if (data.name !== undefined) i.name = data.name;
        if (data.description !== undefined) i.description = data.description;
        if (data.location !== undefined) i.location = data.location;
        if (data.purchaseDate !== undefined) i.purchaseDate = data.purchaseDate;
        if (data.purchasePrice !== undefined) i.purchasePrice = data.purchasePrice;
      });
    });
  }

  async deleteItem(id: string): Promise<void> {
    const item = await this.getItem(id);
    if (!item) return;

    await database.write(async () => {
      // Delete related records first
      const properties = await this.propertiesCollection.query(Q.where('item_id', id)).fetch();
      const attachments = await this.attachmentsCollection.query(Q.where('item_id', id)).fetch();
      const itemTags = await this.itemTagsCollection.query(Q.where('item_id', id)).fetch();

      // Delete attachment metadata
      for (const attachment of attachments) {
        const metadata = await this.attachmentMetadataCollection.query(
          Q.where('attachment_id', attachment.id)
        ).fetch();
        for (const m of metadata) {
          await m.destroyPermanently();
        }
      }

      // Delete all related
      for (const p of properties) await p.destroyPermanently();
      for (const a of attachments) await a.destroyPermanently();
      for (const it of itemTags) await it.destroyPermanently();

      // Decrement tag usage counts
      for (const it of itemTags) {
        try {
          const tag = await this.tagsCollection.find(it.tagId);
          await tag.update((t: Tag) => {
            (t as any).usageCount = Math.max(0, (t as any).usageCount - 1);
          });
        } catch {
          // Tag not found, skip
        }
      }

      // Delete item
      await item.destroyPermanently();
    });
  }

  // ========== PROPERTIES ==========

  async getPropertiesForItem(itemId: string): Promise<Property[]> {
    return this.propertiesCollection.query(Q.where('item_id', itemId)).fetch();
  }

  async createProperty(data: CreatePropertyDTO): Promise<Property> {
    return database.write(async () => {
      return this.propertiesCollection.create((property) => {
        property.itemId = data.itemId;
        property.key = data.key;
        property.value = data.value;
        property.unit = data.unit;
      });
    });
  }

  async updateProperty(id: string, data: { key?: string; value?: string; unit?: string }): Promise<Property | null> {
    try {
      const property = await this.propertiesCollection.find(id);
      return database.write(async () => {
        return property.update((p) => {
          if (data.key !== undefined) p.key = data.key;
          if (data.value !== undefined) p.value = data.value;
          if (data.unit !== undefined) p.unit = data.unit;
        });
      });
    } catch {
      return null;
    }
  }

  async deleteProperty(id: string): Promise<void> {
    try {
      const property = await this.propertiesCollection.find(id);
      await database.write(async () => {
        await property.destroyPermanently();
      });
    } catch {
      // Ignore
    }
  }

  // ========== ATTACHMENTS ==========

  async getAttachmentsForItem(itemId: string): Promise<Attachment[]> {
    return this.attachmentsCollection.query(Q.where('item_id', itemId)).fetch();
  }

  async createAttachment(data: CreateAttachmentDTO): Promise<Attachment> {
    return database.write(async () => {
      return this.attachmentsCollection.create((attachment) => {
        attachment.itemId = data.itemId;
        attachment.fileUri = data.fileUri;
        attachment.mimeType = data.mimeType;
        attachment.fileSize = data.fileSize;
        attachment.originalFilename = data.originalFilename;
        attachment.altText = data.altText;
      });
    });
  }

  async deleteAttachment(id: string): Promise<void> {
    try {
      const attachment = await this.attachmentsCollection.find(id);
      await database.write(async () => {
        // Delete metadata
        const metadata = await this.attachmentMetadataCollection.query(
          Q.where('attachment_id', id)
        ).fetch();
        for (const m of metadata) {
          await m.destroyPermanently();
        }
        await attachment.destroyPermanently();
      });
    } catch {
      // Ignore
    }
  }

  // Attachment Metadata
  async getAttachmentMetadata(attachmentId: string): Promise<AttachmentMetadata[]> {
    return this.attachmentMetadataCollection.query(Q.where('attachment_id', attachmentId)).fetch();
  }

  async createAttachmentMetadata(data: CreateAttachmentMetadataDTO): Promise<AttachmentMetadata> {
    return database.write(async () => {
      return this.attachmentMetadataCollection.create((meta) => {
        meta.attachmentId = data.attachmentId;
        meta.key = data.key;
        meta.value = data.value;
      });
    });
  }

  // ========== TAGS ==========

  async getTags(filters?: TagFilters): Promise<Tag[]> {
    let tags = await this.tagsCollection.query().fetch();

    // Filter by search
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      tags = tags.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.normalizedName.includes(search)
      );
    }

    // Filter by min usage
    if (filters?.minUsageCount !== undefined) {
      tags = tags.filter((t) => t.usageCount >= filters.minUsageCount!);
    }

    // Sort
    const sortBy = filters?.sortBy || 'usage_count';
    const sortOrder = filters?.sortOrder || 'desc';
    tags.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'usage_count') {
        comparison = a.usageCount - b.usageCount;
      } else if (sortBy === 'created_at') {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return tags;
  }

  async getTag(id: string): Promise<Tag | null> {
    try {
      return await this.tagsCollection.find(id);
    } catch {
      return null;
    }
  }

  async findTagByName(name: string): Promise<Tag | null> {
    const normalized = Tag.normalize(name);
    const tags = await this.tagsCollection.query().fetch();
    return tags.find((t) => t.normalizedName === normalized) || null;
  }

  async findOrCreateTag(name: string, color?: string): Promise<{ tag: Tag; isNew: boolean }> {
    const existing = await this.findTagByName(name);
    if (existing) {
      // Increment usage count
      await database.write(async () => {
        await existing.update((t) => {
          t.usageCount = t.usageCount + 1;
        });
      });
      return { tag: existing, isNew: false };
    }

    // Create new tag
    const newTag = await database.write(async () => {
      return this.tagsCollection.create((tag) => {
        tag.name = name;
        tag.normalizedName = Tag.normalize(name);
        tag.slug = Tag.slugify(name);
        tag.color = color;
        tag.usageCount = 1;
      });
    });

    return { tag: newTag, isNew: true };
  }

  async updateTag(id: string, data: { name?: string; color?: string }): Promise<Tag | null> {
    const tag = await this.getTag(id);
    if (!tag) return null;

    return database.write(async () => {
      return tag.update((t) => {
        if (data.name !== undefined) {
          t.name = data.name;
          t.normalizedName = Tag.normalize(data.name);
          t.slug = Tag.slugify(data.name);
        }
        if (data.color !== undefined) t.color = data.color;
      });
    });
  }

  async deleteTag(id: string): Promise<void> {
    const tag = await this.getTag(id);
    if (!tag) return;

    await database.write(async () => {
      // Delete item_tags associations
      const itemTags = await this.itemTagsCollection.query(Q.where('tag_id', id)).fetch();
      for (const it of itemTags) {
        await it.destroyPermanently();
      }
      await tag.destroyPermanently();
    });
  }

  async mergeTags(sourceTagId: string, targetTagId: string): Promise<void> {
    await database.write(async () => {
      // Get all item_tags with source tag
      const sourceItemTags = await this.itemTagsCollection
        .query(Q.where('tag_id', sourceTagId))
        .fetch();

      // Get target tag
      const targetTag = await this.tagsCollection.find(targetTagId);

      // For each item_tag, check if target tag already exists for that item
      for (const sourceIt of sourceItemTags) {
        const existingTargetTag = await this.itemTagsCollection
          .query(Q.where('item_id', sourceIt.itemId), Q.where('tag_id', targetTagId))
          .fetch();

        if (existingTargetTag.length === 0) {
          // Update the source item_tag to point to target tag
          await sourceIt.update((it) => {
            it.tagId = targetTagId;
          });
        } else {
          // Delete the duplicate
          await sourceIt.destroyPermanently();
        }
      }

      // Delete source tag
      const sourceTag = await this.tagsCollection.find(sourceTagId);
      await sourceTag.destroyPermanently();

      // Update target tag usage count
      const newCount = await this.itemTagsCollection
        .query(Q.where('tag_id', targetTagId))
        .fetchCount();
      await targetTag.update((t) => {
        t.usageCount = newCount;
      });
    });
  }

  // ========== ITEM-TAG ASSOCIATIONS ==========

  async getItemTagIds(itemId: string): Promise<string[]> {
    const itemTags = await this.itemTagsCollection.query(Q.where('item_id', itemId)).fetch();
    return itemTags.map((it) => it.tagId);
  }

  async addTagToItem(itemId: string, tagId: string): Promise<boolean> {
    // Check if already associated
    const existing = await this.itemTagsCollection
      .query(Q.where('item_id', itemId), Q.where('tag_id', tagId))
      .fetch();

    if (existing.length > 0) return false;

    await database.write(async () => {
      await this.itemTagsCollection.create((it) => {
        it.itemId = itemId;
        it.tagId = tagId;
      });

      // Increment tag usage
      const tag = await this.tagsCollection.find(tagId);
      await tag.update((t) => {
        t.usageCount = t.usageCount + 1;
      });
    });

    return true;
  }

  async removeTagFromItem(itemId: string, tagId: string): Promise<void> {
    const itemTags = await this.itemTagsCollection
      .query(Q.where('item_id', itemId), Q.where('tag_id', tagId))
      .fetch();

    await database.write(async () => {
      for (const it of itemTags) {
        await it.destroyPermanently();

        // Decrement tag usage
        const tag = await this.tagsCollection.find(tagId);
        await tag.update((t) => {
          t.usageCount = Math.max(0, t.usageCount - 1);
        });
      }
    });
  }

  async setItemTags(itemId: string, tagIds: string[]): Promise<void> {
    const currentTagIds = await this.getItemTagIds(itemId);

    // Find tags to add and remove
    const toAdd = tagIds.filter((id) => !currentTagIds.includes(id));
    const toRemove = currentTagIds.filter((id) => !tagIds.includes(id));

    await database.write(async () => {
      // Remove old tags
      for (const tagId of toRemove) {
        const itemTags = await this.itemTagsCollection
          .query(Q.where('item_id', itemId), Q.where('tag_id', tagId))
          .fetch();
        for (const it of itemTags) {
          await it.destroyPermanently();
          const tag = await this.tagsCollection.find(tagId);
          await tag.update((t) => {
            t.usageCount = Math.max(0, t.usageCount - 1);
          });
        }
      }

      // Add new tags
      for (const tagId of toAdd) {
        await this.itemTagsCollection.create((it) => {
          it.itemId = itemId;
          it.tagId = tagId;
        });
        const tag = await this.tagsCollection.find(tagId);
        await tag.update((t) => {
          t.usageCount = t.usageCount + 1;
        });
      }
    });
  }

  // ========== SUGGESTIONS ==========

  async getSuggestedProperties(tagIds: string[]): Promise<PropertySuggestion[]> {
    if (tagIds.length === 0) return [];

    // Get all item_tags with these tags
    const itemTags = await this.itemTagsCollection.query().fetch();
    const relevantItemTags = itemTags.filter((it) => tagIds.includes(it.tagId));

    // Get unique item IDs
    const itemIds = [...new Set(relevantItemTags.map((it) => it.itemId))];

    // Get all properties for these items
    const keyFrequency = new Map<string, number>();

    for (const itemId of itemIds) {
      const properties = await this.propertiesCollection
        .query(Q.where('item_id', itemId))
        .fetch();

      for (const prop of properties) {
        const count = keyFrequency.get(prop.key) || 0;
        keyFrequency.set(prop.key, count + 1);
      }
    }

    // Sort by frequency
    return Array.from(keyFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, frequency]) => ({ key, frequency }));
  }

  // ========== SETTINGS ==========

  async getSetting(key: string): Promise<string | null> {
    try {
      const settings = await this.settingsCollection.query(Q.where('key', key)).fetch();
      return settings[0]?.value || null;
    } catch {
      return null;
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    await database.write(async () => {
      const existing = await this.settingsCollection.query(Q.where('key', key)).fetch();

      if (existing.length > 0) {
        await existing[0].update((s) => {
          s.value = value;
        });
      } else {
        await this.settingsCollection.create((s) => {
          s.key = key;
          s.value = value;
        });
      }
    });
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const settings = await this.settingsCollection.query().fetch();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  // ========== STATS ==========

  async getItemCount(): Promise<number> {
    return this.itemsCollection.query().fetchCount();
  }

  async getTagDistribution(): Promise<{ tag: Tag; count: number }[]> {
    const tags = await this.getTags();
    return tags
      .filter((t) => t.usageCount > 0)
      .map((tag) => ({ tag, count: tag.usageCount }))
      .sort((a, b) => b.count - a.count);
  }

  async getTotalValue(): Promise<number> {
    const items = await this.itemsCollection.query().fetch();
    return items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
  }
}

export const databaseService = new DatabaseService();
export default DatabaseService;
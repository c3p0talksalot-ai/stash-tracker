import { Model } from '@nozbe/watermelondb';
import { field, date, children, lazy } from '@nozbe/watermelondb/decorators';

export default class Tag extends Model {
  static table = 'tags';

  static associations = {
    item_tags: { type: 'has_many' as const, foreignKey: 'tag_id' },
  };

  @field('name') name!: string;
  @field('normalized_name') normalizedName!: string;
  @field('slug') slug!: string;
  @field('color') color?: string;
  @field('usage_count') usageCount!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('item_tags') itemTags!: any;
  @lazy items = this.collections.get('items').query();

  // Helpers for tag management
  static normalize(name: string): string {
    return name.trim().toLowerCase();
  }

  static slugify(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async incrementUsage() {
    await this.update((tag) => {
      tag.usageCount = tag.usageCount + 1;
    });
  }

  async decrementUsage() {
    await this.update((tag) => {
      tag.usageCount = Math.max(0, tag.usageCount - 1);
    });
  }
}
import { Model } from '@nozbe/watermelondb';
import { field, date, children, lazy } from '@nozbe/watermelondb/decorators';
import type Property from './Property';
import type Attachment from './Attachment';

export default class Item extends Model {
  static table = 'items';

  static associations = {
    properties: { type: 'has_many' as const, foreignKey: 'item_id' },
    attachments: { type: 'has_many' as const, foreignKey: 'item_id' },
    item_tags: { type: 'has_many' as const, foreignKey: 'item_id' },
  };

  @field('name') name!: string;
  @field('description') description?: string;
  @field('location') location?: string;
  @field('purchase_date') purchaseDate?: number;
  @field('purchase_price') purchasePrice?: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('properties') properties!: Property[];
  @children('attachments') attachments!: Attachment[];
  @lazy tags = this.collections.get('tags').query();

  async addProperty(key: string, value: string, unit?: string) {
    return this.collections.get('properties').create((property) => {
      (property as any).itemId = this.id;
      (property as any).key = key;
      (property as any).value = value;
      (property as any).unit = unit;
    });
  }

  async addAttachment(fileUri: string, mimeType: string, fileSize?: number) {
    return this.collections.get('attachments').create((attachment) => {
      (attachment as any).itemId = this.id;
      (attachment as any).fileUri = fileUri;
      (attachment as any).mimeType = mimeType;
      (attachment as any).fileSize = fileSize;
    });
  }
}
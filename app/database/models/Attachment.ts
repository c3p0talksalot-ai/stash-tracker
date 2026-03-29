import { Model } from '@nozbe/watermelondb';
import { field, date, relation, children } from '@nozbe/watermelondb/decorators';
import type Item from './Item';
import type AttachmentMetadata from './AttachmentMetadata';

export default class Attachment extends Model {
  static table = 'attachments';

  static associations = {
    items: { type: 'belongs_to' as const, key: 'item_id' },
    attachment_metadata: { type: 'has_many' as const, foreignKey: 'attachment_id' },
  };

  @field('item_id') itemId!: string;
  @field('file_uri') fileUri!: string;
  @field('mime_type') mimeType!: string;
  @field('file_size') fileSize?: number;
  @field('thumbnail_uri') thumbnailUri?: string;
  @field('original_filename') originalFilename?: string;
  @field('alt_text') altText?: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('items', 'item_id') item!: Item;
  @children('attachment_metadata') metadata!: AttachmentMetadata[];

  async addMetadata(key: string, value: string) {
    return this.collections.get('attachment_metadata').create((meta) => {
      (meta as any).attachmentId = this.id;
      (meta as any).key = key;
      (meta as any).value = value;
    });
  }
}
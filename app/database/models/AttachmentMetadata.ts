import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type Attachment from './Attachment';

export default class AttachmentMetadata extends Model {
  static table = 'attachment_metadata';

  static associations = {
    attachments: { type: 'belongs_to' as const, key: 'attachment_id' },
  };

  @field('attachment_id') attachmentId!: string;
  @field('key') key!: string;
  @field('value') value!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('attachments', 'attachment_id') attachment!: Attachment;
}
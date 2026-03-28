import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type Item from './Item';
import type Tag from './Tag';

export default class ItemTag extends Model {
  static table = 'item_tags';

  static associations = {
    items: { type: 'belongs_to' as const, key: 'item_id' },
    tags: { type: 'belongs_to' as const, key: 'tag_id' },
  };

  @field('item_id') itemId!: string;
  @field('tag_id') tagId!: string;
  @date('created_at') createdAt!: Date;

  @relation('items', 'item_id') item!: Item;
  @relation('tags', 'tag_id') tag!: Tag;
}
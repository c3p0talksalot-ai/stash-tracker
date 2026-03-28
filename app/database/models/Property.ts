import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type Item from './Item';

export default class Property extends Model {
  static table = 'properties';

  static associations = {
    items: { type: 'belongs_to' as const, key: 'item_id' },
  };

  @field('item_id') itemId!: string;
  @field('key') key!: string;
  @field('value') value!: string;
  @field('unit') unit?: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('items', 'item_id') item!: Item;
}
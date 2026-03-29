import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import Item from './models/Item';
import Property from './models/Property';
import Attachment from './models/Attachment';
import AttachmentMetadata from './models/AttachmentMetadata';
import Tag from './models/Tag';
import ItemTag from './models/ItemTag';
import Setting from './models/Setting';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true,
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Item, Property, Attachment, AttachmentMetadata, Tag, ItemTag, Setting],
});

export { Item, Property, Attachment, AttachmentMetadata, Tag, ItemTag, Setting };
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'items',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'purchase_date', type: 'number', isOptional: true },
        { name: 'purchase_price', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'properties',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true },
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'unit', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'attachments',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true },
        { name: 'file_uri', type: 'string' },
        { name: 'mime_type', type: 'string' },
        { name: 'file_size', type: 'number', isOptional: true },
        { name: 'thumbnail_uri', type: 'string', isOptional: true },
        { name: 'original_filename', type: 'string', isOptional: true },
        { name: 'alt_text', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'attachment_metadata',
      columns: [
        { name: 'attachment_id', type: 'string', isIndexed: true },
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tags',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'normalized_name', type: 'string', isIndexed: true },
        { name: 'slug', type: 'string', isIndexed: true },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'usage_count', type: 'number' },
        { name: 'is_preseeded', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'item_tags',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true },
        { name: 'tag_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'settings',
      columns: [
        { name: 'key', type: 'string', isIndexed: true },
        { name: 'value', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
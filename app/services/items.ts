import { Q } from "@nozbe/watermelondb"
import { database, Item, Property, Tag, ItemTag } from "../database"
import type { Model } from "@nozbe/watermelondb"

export interface ItemInput {
  name: string
  description?: string
  location?: string
  purchaseDate?: number
  purchasePrice?: number
  tags?: string[]
  properties?: { key: string; value: string; unit?: string }[]
}

export interface ItemOutput {
  id: string
  name: string
  description?: string
  location?: string
  purchaseDate?: number
  purchasePrice?: number
  tags: string[]
  properties: { key: string; value: string; unit?: string }[]
  createdAt: number
  updatedAt: number
}

// Convert database model to plain object
async function itemToOutput(item: Item): Promise<ItemOutput> {
  // Get properties via direct query
  const propsCollection = database.get<Property>("properties")
  const props = await propsCollection.query(Q.where("item_id", item.id)).fetch()
  
  // Get tags through item_tags join table
  const itemTagsCollection = database.get<ItemTag>("item_tags")
  const itemTags = await itemTagsCollection.query(Q.where("item_id", item.id)).fetch()
  const tagIds = itemTags.map((it) => it.tagId)
  
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    location: item.location,
    purchaseDate: item.purchaseDate,
    purchasePrice: item.purchasePrice,
    tags: tagIds,
    properties: props.map((p) => ({
      key: p.key,
      value: p.value,
      unit: p.unit,
    })),
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  }
}

// CRUD Operations

export async function createItem(input: ItemInput): Promise<ItemOutput> {
  const itemsCollection = database.get<Item>("items")
  
  const newItem = await database.write(async () => {
    const item = await itemsCollection.create((record) => {
      record.name = input.name
      record.description = input.description || ""
      record.location = input.location || ""
      record.purchaseDate = input.purchaseDate || 0
      record.purchasePrice = input.purchasePrice || 0
    })
    
    // Add properties
    if (input.properties && input.properties.length > 0) {
      const propsCollection = database.get<Property>("properties")
      for (const prop of input.properties) {
        await propsCollection.create((p) => {
          p.itemId = item.id
          p.key = prop.key
          p.value = prop.value
          p.unit = prop.unit || ""
        })
      }
    }
    
    // Add tags
    if (input.tags && input.tags.length > 0) {
      const itemTagsCollection = database.get<ItemTag>("item_tags")
      for (const tagId of input.tags) {
        await itemTagsCollection.create((it) => {
          it.itemId = item.id
          it.tagId = tagId
        })
      }
    }
    
    return item
  })
  
  return itemToOutput(newItem)
}

export async function getItem(id: string): Promise<ItemOutput | null> {
  try {
    const itemsCollection = database.get<Item>("items")
    const item = await itemsCollection.find(id)
    return itemToOutput(item)
  } catch {
    return null
  }
}

export async function getAllItems(): Promise<ItemOutput[]> {
  const itemsCollection = database.get<Item>("items")
  const items = await itemsCollection.query().fetch()
  return Promise.all(items.map(itemToOutput))
}

export async function updateItem(id: string, input: Partial<ItemInput>): Promise<ItemOutput | null> {
  try {
    const itemsCollection = database.get<Item>("items")
    const item = await itemsCollection.find(id)
    
    await database.write(async () => {
      await item.update((record) => {
        if (input.name !== undefined) record.name = input.name
        if (input.description !== undefined) record.description = input.description
        if (input.location !== undefined) record.location = input.location
        if (input.purchaseDate !== undefined) record.purchaseDate = input.purchaseDate
        if (input.purchasePrice !== undefined) record.purchasePrice = input.purchasePrice
      })
      
      // Update properties: delete existing and create new
      if (input.properties !== undefined) {
        const propsCollection = database.get<Property>("properties")
        const existingProps = await propsCollection.query(Q.where("item_id", id)).fetch()
        for (const prop of existingProps) {
          await prop.destroyPermanently()
        }
        for (const prop of input.properties) {
          await propsCollection.create((p) => {
            p.itemId = id
            p.key = prop.key
            p.value = prop.value
            p.unit = prop.unit || ""
          })
        }
      }
      
      // Update tags: delete existing and create new
      if (input.tags !== undefined) {
        const itemTagsCollection = database.get<ItemTag>("item_tags")
        const existingTags = await itemTagsCollection.query(Q.where("item_id", id)).fetch()
        for (const tag of existingTags) {
          await tag.destroyPermanently()
        }
        for (const tagId of input.tags) {
          await itemTagsCollection.create((it) => {
            it.itemId = id
            it.tagId = tagId
          })
        }
      }
    })
    
    return itemToOutput(item)
  } catch {
    return null
  }
}

export async function deleteItem(id: string): Promise<boolean> {
  try {
    const itemsCollection = database.get<Item>("items")
    const item = await itemsCollection.find(id)
    
    await database.write(async () => {
      // Delete related properties
      const propsCollection = database.get<Property>("properties")
      const props = await propsCollection.query(Q.where("item_id", id)).fetch()
      for (const prop of props) {
        await prop.destroyPermanently()
      }
      
      // Delete related item_tags
      const itemTagsCollection = database.get<ItemTag>("item_tags")
      const itemTags = await itemTagsCollection.query(Q.where("item_id", id)).fetch()
      for (const it of itemTags) {
        await it.destroyPermanently()
      }
      
      // Delete item
      await item.destroyPermanently()
    })
    
    return true
  } catch {
    return false
  }
}

export async function searchItems(query: string): Promise<ItemOutput[]> {
  const itemsCollection = database.get<Item>("items")
  const items = await itemsCollection
    .query(Q.where("name", Q.like(`%${Q.sanitizeLikeString(query)}%`)))
    .fetch()
  return Promise.all(items.map(itemToOutput))
}

export async function getItemsByTag(tagId: string): Promise<ItemOutput[]> {
  const itemTagsCollection = database.get<ItemTag>("item_tags")
  const itemTags = await itemTagsCollection.query(Q.where("tag_id", tagId)).fetch()
  const itemIds = itemTags.map((it) => it.itemId)
  
  if (itemIds.length === 0) return []
  
  const itemsCollection = database.get<Item>("items")
  const items = await itemsCollection
    .query(Q.where("id", Q.oneOf(itemIds)))
    .fetch()
  return Promise.all(items.map(itemToOutput))
}
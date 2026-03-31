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

// Autocomplete data functions

export interface AutocompleteOption {
  id: string
  label: string
}

export async function getLocationSuggestions(): Promise<AutocompleteOption[]> {
  const itemsCollection = database.get<Item>("items")
  const items = await itemsCollection.query().fetch()
  
  // Extract unique locations
  const locationSet = new Set<string>()
  items.forEach((item) => {
    if (item.location && item.location.trim()) {
      locationSet.add(item.location.trim())
    }
  })
  
  // Convert to autocomplete options with deterministic IDs
  return Array.from(locationSet)
    .sort()
    .map((location, index) => ({
      id: `location-${index}`,
      label: location,
    }))
}

export async function getPropertyKeySuggestions(): Promise<AutocompleteOption[]> {
  const propsCollection = database.get<Property>("properties")
  const props = await propsCollection.query().fetch()
  
  // Extract unique keys
  const keySet = new Set<string>()
  props.forEach((prop) => {
    if (prop.key && prop.key.trim()) {
      keySet.add(prop.key.trim())
    }
  })
  
  return Array.from(keySet)
    .sort()
    .map((key, index) => ({
      id: `key-${index}`,
      label: key,
    }))
}

export async function getPropertyUnitSuggestions(): Promise<AutocompleteOption[]> {
  const propsCollection = database.get<Property>("properties")
  const props = await propsCollection.query().fetch()
  
  // Extract unique units
  const unitSet = new Set<string>()
  props.forEach((prop) => {
    if (prop.unit && prop.unit.trim()) {
      unitSet.add(prop.unit.trim())
    }
  })
  
  return Array.from(unitSet)
    .sort()
    .map((unit, index) => ({
      id: `unit-${index}`,
      label: unit,
    }))
}

export async function getTagSuggestions(): Promise<AutocompleteOption[]> {
  const tagsCollection = database.get<Tag>("tags")
  const tags = await tagsCollection.query().fetch()
  
  return tags
    .map((tag) => ({
      id: tag.id,
      label: tag.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

// Find a tag by name, or create it if it doesn't exist
export async function findOrCreateTag(tagName: string): Promise<string> {
  const tagsCollection = database.get<Tag>("tags")
  
  // Try to find existing tag
  const existingTags = await tagsCollection.query(Q.where("name", tagName)).fetch()
  if (existingTags.length > 0) {
    return existingTags[0].id
  }
  
  // Create new tag
  let newTagId = ""
  await database.write(async () => {
    const newTag = await tagsCollection.create((t) => {
      t.name = tagName
    })
    newTagId = newTag.id
  })
  
  return newTagId
}
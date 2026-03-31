/**
 * Unit tests for items service
 * Tests autocomplete filtering and data transformation logic
 */

describe('items service - autocomplete filtering', () => {
  
  // Test the filtering logic directly without needing DB
  describe('AutocompleteOption filtering', () => {
    interface AutocompleteOption {
      id: string
      label: string
    }

    const mockSuggestions: AutocompleteOption[] = [
      { id: '1', label: 'electronics' },
      { id: '2', label: 'tools' },
      { id: '3', label: 'hardware' },
      { id: '4', label: 'plumbing' },
    ]

    const filterSuggestions = (value: string, suggestions: AutocompleteOption[]): AutocompleteOption[] => {
      if (!value.trim()) return suggestions.slice(0, 10)
      const lowerValue = value.toLowerCase()
      return suggestions
        .filter((s) => s.label.toLowerCase().includes(lowerValue))
        .slice(0, 10)
    }

    it('should return all suggestions when input is empty', () => {
      const result = filterSuggestions('', mockSuggestions)
      expect(result).toHaveLength(4)
    })

    it('should filter suggestions by input value (case insensitive)', () => {
      const result = filterSuggestions('ele', mockSuggestions)
      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('electronics')
    })

    it('should return empty array when no match', () => {
      const result = filterSuggestions('xyz', mockSuggestions)
      expect(result).toHaveLength(0)
    })

    it('should limit to 10 results', () => {
      const manySuggestions = Array.from({ length: 20 }, (_, i) => ({ id: String(i), label: `item-${i}` }))
      const result = filterSuggestions('', manySuggestions)
      expect(result).toHaveLength(10)
    })

    it('should match partial strings', () => {
      const result = filterSuggestions('tool', mockSuggestions)
      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('tools')
    })
  })

  describe('Unique value extraction', () => {
    const getUniqueLocations = (items: { location: string }[]): string[] => {
      const locations = items.map(item => item.location).filter(Boolean)
      return [...new Set(locations)]
    }

    it('should return unique locations', () => {
      const items = [
        { location: 'Shelf A' },
        { location: 'Shelf A' },
        { location: 'Shelf B' },
      ]
      const result = getUniqueLocations(items)
      expect(result).toHaveLength(2)
      expect(result).toContain('Shelf A')
      expect(result).toContain('Shelf B')
    })

    it('should handle empty array', () => {
      const items: { location: string }[] = []
      const result = getUniqueLocations(items)
      expect(result).toHaveLength(0)
    })

    it('should filter out empty/null locations', () => {
      const items = [
        { location: 'Shelf A' },
        { location: '' },
        { location: null as any },
        { location: 'Shelf B' },
      ]
      const result = getUniqueLocations(items)
      expect(result).toHaveLength(2)
    })
  })

  describe('getUniquePropertyKeys', () => {
    const getUniquePropertyKeys = (properties: { key: string }[]): string[] => {
      const keys = properties.map(p => p.key).filter(Boolean)
      return [...new Set(keys)]
    }

    it('should return unique property keys', () => {
      const properties = [
        { key: 'color' },
        { key: 'color' },
        { key: 'size' },
      ]
      const result = getUniquePropertyKeys(properties)
      expect(result).toHaveLength(2)
      expect(result).toContain('color')
      expect(result).toContain('size')
    })
  })

  describe('getUniquePropertyUnits', () => {
    const getUniquePropertyUnits = (properties: { unit?: string }[]): string[] => {
      const units = properties.map(p => p.unit).filter(Boolean) as string[]
      return [...new Set(units)]
    }

    it('should return unique property units', () => {
      const properties = [
        { unit: 'kg' },
        { unit: 'kg' },
        { unit: 'cm' },
      ]
      const result = getUniquePropertyUnits(properties)
      expect(result).toHaveLength(2)
      expect(result).toContain('kg')
      expect(result).toContain('cm')
    })

    it('should handle undefined units', () => {
      const properties = [
        { unit: 'kg' },
        { unit: undefined },
        { unit: 'cm' },
      ]
      const result = getUniquePropertyUnits(properties)
      expect(result).toHaveLength(2)
    })
  })

  describe('Tag ID to name mapping', () => {
    const mapTagIdsToNames = (
      tagIds: string[],
      allTags: { id: string; name: string }[]
    ): Record<string, string> => {
      const tagMap: Record<string, string> = {}
      for (const tag of allTags) {
        if (tagIds.includes(tag.id)) {
          tagMap[tag.id] = tag.name
        }
      }
      return tagMap
    }

    it('should map tag IDs to names', () => {
      const tagIds = ['tag-1', 'tag-2']
      const allTags = [
        { id: 'tag-1', name: 'electronics' },
        { id: 'tag-2', name: 'tools' },
        { id: 'tag-3', name: 'other' },
      ]
      const result = mapTagIdsToNames(tagIds, allTags)
      expect(result).toEqual({
        'tag-1': 'electronics',
        'tag-2': 'tools',
      })
    })

    it('should return empty object for empty input', () => {
      const result = mapTagIdsToNames([], [])
      expect(result).toEqual({})
    })

    it('should only include requested tag IDs', () => {
      const tagIds = ['tag-1']
      const allTags = [
        { id: 'tag-1', name: 'electronics' },
        { id: 'tag-2', name: 'tools' },
      ]
      const result = mapTagIdsToNames(tagIds, allTags)
      expect(result).toEqual({ 'tag-1': 'electronics' })
      expect(result['tag-2']).toBeUndefined()
    })
  })

  describe('AutocompleteOption format', () => {
    it('should format locations as AutocompleteOption', () => {
      const locations = ['Shelf A', 'Shelf B']
      const result = locations.map((label, index) => ({
        id: `loc-${index}`,
        label,
      }))
      expect(result).toEqual([
        { id: 'loc-0', label: 'Shelf A' },
        { id: 'loc-1', label: 'Shelf B' },
      ])
    })

    it('should format tags as AutocompleteOption', () => {
      const tags = [
        { id: 't1', name: 'electronics' },
        { id: 't2', name: 'tools' },
      ]
      const result = tags.map(tag => ({
        id: tag.id,
        label: tag.name,
      }))
      expect(result).toEqual([
        { id: 't1', label: 'electronics' },
        { id: 't2', label: 'tools' },
      ])
    })
  })
})
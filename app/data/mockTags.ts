export type BikeTag = {
  id: string
  title: string
  clue: string
  imageUrl: string
  locationName: string
  foundBy: string
  createdAt: string
  status: 'active' | 'found'
  clueAddedAt?: string
}

export const mockTags: BikeTag[] = [
  {
    id: 'current-overlook',
    title: 'Find the overlook',
    clue: 'A quiet climb with one of the best views in the city.',
    imageUrl: '',
    locationName: 'Iroquois Park',
    foundBy: 'Sample Rider',
    createdAt: '05/17/2026',
    status: 'active',
    clueAddedAt: '05/17/2026'
  },
  {
    id: 'tag-river-trail',
    title: 'River trail mural',
    clue: 'Look for the painted wall near the path.',
    imageUrl: '',
    locationName: 'River trail',
    foundBy: 'Sample Rider',
    createdAt: '05/10/2026',
    status: 'found',
    clueAddedAt: '05/10/2026'
  },
  {
    id: 'tag-coffee-stop',
    title: 'Coffee stop corner',
    clue: 'A good place to refuel after a morning ride.',
    imageUrl: '',
    locationName: 'Neighborhood coffee shop',
    foundBy: 'Sample Rider',
    createdAt: '05/03/2026',
    status: 'found',
    clueAddedAt: '05/03/2026'
  }
]
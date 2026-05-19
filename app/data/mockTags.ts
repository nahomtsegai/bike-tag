export type BikeTag = {
  id: string
  title: string
  clue: string
  imageUrl: string
  locationName: string
  locationMapUrl?: string
  hiddenLocationName?: string
  hiddenLocationMapUrl?: string
  foundBy: string
  createdAt: string
  createdAtIso: string
  status: 'active' | 'found'
}

export const mockTags: BikeTag[] = [
  {
    id: 'current-overlook',
    title: 'Find the overlook',
    clue: 'A quiet climb with one of the best views in the city.',
    imageUrl: '',
    locationName: '',
    hiddenLocationName: 'Iroquois Park overlook',
    hiddenLocationMapUrl: 'https://www.google.com/maps/search/?api=1&query=Iroquois%20Park%20overlook',
    foundBy: 'Sample Rider',
    createdAt: '05/17/2026',
    createdAtIso: '2026-05-17T14:00:00.000Z',
    status: 'active'
  },
  {
    id: 'tag-river-trail',
    title: 'River trail mural',
    clue: 'Look for the painted wall near the path.',
    imageUrl: '',
    locationName: 'River trail',
    locationMapUrl: 'https://www.google.com/maps/search/?api=1&query=River%20trail',
    foundBy: 'Sample Rider',
    createdAt: '05/10/2026',
    createdAtIso: '2026-05-10T14:00:00.000Z',
    status: 'found'
  },
  {
    id: 'tag-coffee-stop',
    title: 'Coffee stop corner',
    clue: 'A good place to refuel after a morning ride.',
    imageUrl: '',
    locationName: 'Neighborhood coffee shop',
    locationMapUrl: 'https://www.google.com/maps/search/?api=1&query=Neighborhood%20coffee%20shop',
    foundBy: 'Sample Rider',
    createdAt: '05/03/2026',
    createdAtIso: '2026-05-03T14:00:00.000Z',
    status: 'found'
  }
]
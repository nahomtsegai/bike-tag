export type BikeTag = {
  id: string
  title: string
  clue: string
  imageUrl: string
  locationName: string
  foundBy: string
  createdAt: string
  status: 'active' | 'found'
}

export const mockTags: BikeTag[] = [
  {
    id: '1',
    title: 'Find the overlook',
    clue: 'A quiet climb with one of the best views in the city.',
    imageUrl: '',
    locationName: 'Iroquois Park',
    foundBy: 'Sample Rider',
    createdAt: '2026 05 17',
    status: 'active'
  },
  {
    id: '2',
    title: 'Coffee stop tag',
    clue: 'Near a place riders like to refuel.',
    imageUrl: '',
    locationName: 'Louisville',
    foundBy: 'Another Rider',
    createdAt: '2026 05 10',
    status: 'found'
  }
]
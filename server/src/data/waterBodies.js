// Reference layer: water bodies shown as "sensitive" on the map.
// These are widely known Hyderabad water bodies. Coordinates are approximate
// centres. This layer is informational: it is NOT an official protected-area
// boundary and does not claim any legal status.

export const waterBodies = [
  {
    id: 'wb-osman-sagar',
    name: 'Osman Sagar (Gandipet)',
    latitude: 17.386,
    longitude: 78.299,
    category: 'DRINKING_WATER_RESERVOIR',
    note: 'Reservoir that has supplied drinking water to Hyderabad.',
    coordinateAccuracy: 'APPROXIMATE',
  },
  {
    id: 'wb-himayat-sagar',
    name: 'Himayat Sagar',
    latitude: 17.32,
    longitude: 78.39,
    category: 'DRINKING_WATER_RESERVOIR',
    note: 'Reservoir that has supplied drinking water to Hyderabad.',
    coordinateAccuracy: 'APPROXIMATE',
  },
  {
    id: 'wb-durgam-cheruvu',
    name: 'Durgam Cheruvu',
    latitude: 17.436,
    longitude: 78.392,
    category: 'URBAN_LAKE',
    note: 'Urban lake. Idol immersion pressure should be avoided where alternatives exist.',
    coordinateAccuracy: 'APPROXIMATE',
  },
];

export const WATER_BODY_DISCLAIMER =
  'Informational layer only. Not an official protected-area boundary.';

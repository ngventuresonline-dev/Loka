export interface FeaturedProperty {
  id: number
  title: string
  location: string
  size: string
  floor: string
  rent: string
  deposit: string
  badge?: 'Leased Out'
}

export const featuredProperties: FeaturedProperty[] = [
  // KORAMANGALA (7 properties)
  {
    id: 1,
    title: 'Commercial Space - 17th Main, Koramangala',
    location: 'Koramangala',
    size: '450 Sq. Ft.',
    floor: 'Ground Floor',
    rent: '₹1,55,000/month',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 2,
    title: 'Prime Commercial Bungalow - 80 Ft Rd, Koramangala',
    location: 'Koramangala',
    size: '5100 Sq. Ft.',
    floor: 'Ground & First Floor',
    rent: '₹8,50,000/month',
    deposit: '11 months'
    // No badge
  },
  {
    id: 3,
    title: 'Commercial Space - 80 Ft Rd, Koramangala',
    location: 'Koramangala',
    size: '1300 Sq. Ft.',
    floor: 'Ground',
    rent: '₹180/Sq. Ft.',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 4,
    title: 'Commercial Space - 80 Ft Road, Koramangala',
    location: 'Koramangala',
    size: '2600 Sq. Ft.',
    floor: 'Ground Floor',
    rent: '₹6,50,000/month',
    deposit: '8 months',
    badge: 'Leased Out'
  },
  {
    id: 5,
    title: 'Commercial Space - 17th Main, Koramangala',
    location: 'Koramangala',
    size: '200 Sq. Ft. (Kiosk)',
    floor: 'Ground Floor',
    rent: '₹1,00,000/month',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 6,
    title: 'Commercial Space - Koramangala 3rd Block',
    location: 'Koramangala',
    size: '500 Sq. Ft.',
    floor: 'Ground',
    rent: '₹50,000/month',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 7,
    title: 'Commercial Space - 80 Ft Rd, Koramangala',
    location: 'Koramangala',
    size: '1000 Sq. Ft.',
    floor: 'Ground Floor',
    rent: '₹1,75,000/month',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  // INDIRANAGAR (10 properties)
  {
    id: 8,
    title: 'Prime Commercial Bungalow - 12th Main, Indiranagar',
    location: 'Indiranagar',
    size: '4000 Sq. Ft.',
    floor: 'Old Bungalow',
    rent: '₹14,00,000/month',
    deposit: '8 months'
    // No badge
  },
  {
    id: 9,
    title: 'Prime Commercial Space - 12th Main, Indiranagar',
    location: 'Indiranagar',
    size: '1000 Sq. Ft.',
    floor: 'Ground Floor',
    rent: '₹350/Sq. Ft.',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 10,
    title: 'Commercial Space - 80 Ft Road, Indiranagar',
    location: 'Indiranagar',
    size: '500 Sq. Ft.',
    floor: 'Ground Floor',
    rent: '₹1,20,000/month',
    deposit: '6 months',
    badge: 'Leased Out'
  },
  {
    id: 11,
    title: 'Prime Commercial Space - 12th Main, Indiranagar',
    location: 'Indiranagar',
    size: '2000-2500 Sq. Ft.',
    floor: 'Ground Floor',
    rent: '₹360/Sq. Ft.',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 12,
    title: 'Prime Commercial Space - 12th Main, Indiranagar',
    location: 'Indiranagar',
    size: '3200 Sq. Ft.',
    floor: 'Ground Floor',
    rent: '₹11,00,000/month',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 13,
    title: 'Prime Commercial Space - 12th Main, Indiranagar',
    location: 'Indiranagar',
    size: '4200 Sq. Ft.',
    floor: 'Ground Floor',
    rent: '₹12,00,000/month',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 14,
    title: 'Prime Commercial Land - 100ft Main Road, Indiranagar',
    location: 'Indiranagar',
    size: '4050 Sq. Ft. Land, 16000 Sq. Ft. Built up',
    floor: 'Built To Suit',
    rent: '₹180/Sq. Ft.',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 15,
    title: 'Prime Commercial Space - 100ft Main Road, Indiranagar',
    location: 'Indiranagar',
    size: '3500 Sq. Ft.',
    floor: 'Ground & First Floor',
    rent: '₹20,00,000/month',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 16,
    title: 'Prime Commercial Bungalow - 13th Main, Indiranagar',
    location: 'Indiranagar',
    size: '2700 Sq. Ft.',
    floor: 'Ground, First & Terrace',
    rent: '₹3,50,000/month',
    deposit: '10 months',
    badge: 'Leased Out'
  },
  {
    id: 17,
    title: 'Commercial Shop - 13th Main, Indiranagar',
    location: 'Indiranagar',
    size: '200 Sq. Ft.',
    floor: 'Ground Floor (Stilt)',
    rent: '₹60,000/month',
    deposit: '10 months',
    badge: 'Leased Out'
  }
]


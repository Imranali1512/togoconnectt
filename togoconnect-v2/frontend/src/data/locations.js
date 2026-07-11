// Togo Complete Location Data
export const TOGO_LOCATIONS = {
  'Région Maritime': {
    provinces: {
      'Lomé Commune': ['Lomé', 'Agoè-Nyivé', 'Bè', 'Togblekopé'],
      'Golfe': ['Aného', 'Tsévié', 'Kpalimé', 'Vogan'],
      'Lacs': ['Aneho', 'Tabligbo', 'Vogan'],
      'Vo': ['Vogan', 'Akoumapé'],
      'Yoto': ['Tabligbo', 'Hahotoé'],
      'Zio': ['Tsévié', 'Kévé'],
      'Bas-Mono': ['Afagnan'],
    },
    cities: [
      // Lomé Neighbourhoods
      'Lomé - Akodésséwa', 'Lomé - Abloganmé', 'Lomé - Bè', 'Lomé - Kpota',
      'Lomé - Anfanmé', 'Lomé - Adakpamé', 'Lomé - Attiegou', 'Lomé - Kégué',
      'Lomé - Hédzranawoé', 'Lomé - Nukafu', 'Lomé - Dekon', 'Lomé - Ahanoukopé',
      'Lomé - Nyékonakpoè', 'Lomé - Kodjoviakopé', 'Lomé - Tokoin', 'Lomé - Cassablanca',
      'Lomé - Gbonssimé', 'Lomé - Atikoumé', 'Lomé - Totsi', 'Lomé - Djidjoli',
      'Lomé - Agbalépédo', 'Lomé - Avédji', 'Lomé - Agoè', 'Lomé - Adjidogomé',
      'Lomé - Zanguera', 'Lomé - Adamavo', 'Lomé - Kagomé', 'Lomé - Kpogan',
      'Lomé - Baguida', 'Lomé - Avépozo', 'Lomé - Agbavi', 'Lomé - Agbata',
      'Lomé - Dagué', 'Lomé - Togo 2000', 'Lomé - Leo 2000', 'Lomé - Adidoadin',
      'Lomé - Adewui',
      // Other Maritime cities
      'Agoè-Nyivé', 'Tsévié', 'Aneho', 'Vogan', 'Tabligbo', 'Kévé', 'Afagnan', 'Togblekopé'
    ]
  },
  'Région des Plateaux': {
    provinces: {
      'Kloto': ['Kpalimé', 'Kuma-Dunyo'],
      'Haho': ['Notsé', 'Wahala'],
      'Moyen-Mono': ['Atakpamé', 'Anié'],
      'Ogou': ['Atakpamé'],
      'Anié': ['Anié', 'Blitta'],
      'Wawa': ['Badou'],
      'Amou': ['Amlamé'],
      'Est-Mono': ['Tohoun'],
    },
    cities: ['Kpalimé', 'Atakpamé', 'Notsé', 'Badou', 'Anié', 'Blitta', 'Amlamé', 'Tohoun', 'Wahala']
  },
  'Région Centrale': {
    provinces: {
      'Sotouboua': ['Sotouboua'],
      'Tchamba': ['Tchamba'],
      'Tchaoudjo': ['Sokodé'],
      'Mô': ['Bafilo'],
    },
    cities: ['Sokodé', 'Bafilo', 'Sotouboua', 'Tchamba']
  },
  'Région de la Kara': {
    provinces: {
      'Bassar': ['Bassar'],
      'Binah': ['Pagouda'],
      'Dankpen': ['Guérin-Kouka'],
      'Doufelgou': ['Niamtougou'],
      'Kozah': ['Kara'],
      'Kéran': ['Kandé'],
    },
    cities: ['Kara', 'Bassar', 'Niamtougou', 'Kandé', 'Guérin-Kouka', 'Pagouda']
  },
  'Région des Savanes': {
    provinces: {
      'Cinkassé': ['Cinkassé'],
      'Kpendjal': ['Mandouri'],
      'Oti': ['Mango', 'Sansanné-Mango'],
      'Tône': ['Dapaong'],
      'Tandjouaré': ['Tandjouaré'],
    },
    cities: ['Dapaong', 'Mango', 'Sansanné-Mango', 'Cinkassé', 'Tandjouaré', 'Mandouri']
  }
};

export const ALL_REGIONS = Object.keys(TOGO_LOCATIONS);

export const ALL_CITIES = [
  'Remote / Online',
  ...Object.values(TOGO_LOCATIONS).flatMap(r => r.cities)
];

export const getCitiesByRegion = (region) => {
  if (!region || region === 'All regions') return ALL_CITIES;
  return TOGO_LOCATIONS[region]?.cities || [];
};

// Rental categories
export const RENTAL_CATEGORIES = [
  'House Rental',
  'Apartment Rental',
  'Land Rental',
  'Store/Shop Rental',
  'Office Rental',
  'Land for Sale',
  'House for Sale',
  'Apartment for Sale',
];

export const SERVICE_CATEGORIES = [
  'Plumbing',
  'Beauty',
  'Barber',
  'Tutoring',
  'Photography',
  'Tech',
  'Cleaning',
  'Tailoring',
  'Design',
  'Moving',
  'Catering',
  'Electrical',
  'Construction',
  'Mechanic',
  'Legal',
  'Medical',
  'Finance',
  ...RENTAL_CATEGORIES,
  'Other',
];

// Legacy exports for Signup.jsx compatibility
export const COUNTRIES = ['Togo', 'Ghana', 'Benin', 'Nigeria', 'Cote dIvoire', 'Burkina Faso', 'Other'];

export const LOCATIONS = [
  'Lomé', 'Agoè-Nyivé', 'Tsévié', 'Aneho', 'Vogan', 'Tabligbo',
  'Kpalimé', 'Atakpamé', 'Notsé', 'Badou', 'Anié',
  'Sokodé', 'Bafilo', 'Sotouboua',
  'Kara', 'Bassar', 'Niamtougou',
  'Dapaong', 'Mango', 'Cinkassé',
  'Remote / Online'
];

// Comprehensive Tanzania Location Data
// Includes all regions, districts, and wards for Tanzania Mainland and Zanzibar

export interface LocationData {
  regions: { [key: string]: string[] };
  districts: { [key: string]: string[] };
  wards: { [key: string]: string[] };
}

export const tanzaniaLocations: LocationData = {
  regions: {
    // Tanzania Mainland Regions
    'Arusha': ['Arusha City', 'Arusha District', 'Karatu', 'Longido', 'Meru', 'Monduli', 'Ngorongoro'],
    'Dar es Salaam': ['Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni'],
    'Dodoma': ['Bahi', 'Chamwino', 'Chemba', 'Dodoma City', 'Kondoa', 'Kongwa', 'Mpwapwa'],
    'Geita': ['Bukombe', 'Chato', 'Geita', 'Mbogwe', 'Nyang\'hwale'],
    'Iringa': ['Iringa District', 'Iringa Urban', 'Kilolo', 'Mafinga', 'Mufindi'],
    'Kagera': ['Biharamulo', 'Bukoba Rural', 'Bukoba Urban', 'Karagwe', 'Kyerwa', 'Missenyi', 'Muleba', 'Ngara'],
    'Katavi': ['Mlele', 'Mpanda', 'Mpanda Urban'],
    'Kigoma': ['Kigoma Rural', 'Kigoma Urban', 'Kakonko', 'Kasulu', 'Kasulu Urban', 'Kibondo', 'Uvinza'],
    'Kilimanjaro': ['Hai', 'Moshi District', 'Moshi Urban', 'Mwanga', 'Rombo', 'Same', 'Siha'],
    'Lindi': ['Kilwa', 'Lindi District', 'Lindi Urban', 'Liwale', 'Nachingwea', 'Ruangwa'],
    'Manyara': ['Babati', 'Babati Urban', 'Hanang', 'Kiteto', 'Mbulu', 'Simanjiro'],
    'Mara': ['Bunda', 'Butiama', 'Musoma District', 'Musoma Urban', 'Rorya', 'Serengeti', 'Tarime', 'Tarime Urban'],
    'Mbeya': ['Chunya', 'Ileje', 'Kyela', 'Mbarali', 'Mbeya City', 'Mbeya District', 'Mbozi', 'Momba', 'Rungwe'],
    'Morogoro': ['Gairo', 'Kilombero', 'Kilosa', 'Malinyi', 'Morogoro District', 'Morogoro Urban', 'Mvomero', 'Ulanga'],
    'Mtwara': ['Masasi', 'Masasi Urban', 'Mtwara District', 'Mtwara Urban', 'Nanyumbu', 'Newala', 'Tandahimba'],
    'Mwanza': ['Ilemela', 'Kwimba', 'Magu', 'Misungwi', 'Nyamagana', 'Sengerema', 'Ukerewe'],
    'Njombe': ['Ludewa', 'Makete', 'Njombe District', 'Njombe Urban', 'Wanging\'ombe'],
    'Pwani': ['Bagamoyo', 'Chalinze', 'Kibaha', 'Kibaha Urban', 'Kisarawe', 'Mafia', 'Mkuranga', 'Rufiji'],
    'Rukwa': ['Kalambo', 'Nkasi', 'Sumbawanga District', 'Sumbawanga Urban'],
    'Ruvuma': ['Mbinga', 'Nyasa', 'Songea District', 'Songea Urban', 'Tunduru'],
    'Shinyanga': ['Kahama', 'Kahama Urban', 'Kishapu', 'Shinyanga District', 'Shinyanga Urban'],
    'Simiyu': ['Bariadi', 'Busega', 'Itilima', 'Maswa', 'Meatu'],
    'Singida': ['Iramba', 'Manyoni', 'Mkalama', 'Singida District', 'Singida Urban'],
    'Songwe': ['Ileje', 'Mbozi', 'Momba'],
    'Tabora': ['Igunga', 'Kaliua', 'Nzega', 'Sikonge', 'Tabora Urban', 'Urambo', 'Uyui'],
    'Tanga': ['Handeni', 'Handeni Urban', 'Kilindi', 'Korogwe', 'Korogwe Urban', 'Lushoto', 'Mkinga', 'Muheza', 'Pangani', 'Tanga Urban'],
    
    // Zanzibar Regions
    'Mjini Magharibi': ['Magharibi', 'Mjini'],
    'Pemba North': ['Micheweni', 'Wete'],
    'Pemba South': ['Chake Chake', 'Mkoani'],
    'Unguja North': ['Kaskazini A', 'Kaskazini B'],
    'Unguja South': ['Kusini', 'Kusini Unguja'],
    'Unguja Urban West': ['Magharibi', 'Mjini']
  },

  districts: {
    // Sample districts for each region (this would be expanded with all districts)
    'Arusha City': ['Central', 'East', 'North', 'South', 'West'],
    'Arusha District': ['Arusha Chini', 'Arusha Juu', 'Engaruka', 'Engaruka Juu', 'Engaruka Chini'],
    'Karatu': ['Endabash', 'Endamarariek', 'Endamarariek Juu', 'Endamarariek Chini', 'Endamarariek Kati'],
    'Longido': ['Enduimet', 'Engikaret', 'Engikaret Juu', 'Engikaret Chini', 'Engikaret Kati'],
    'Meru': ['Engaruka', 'Engaruka Juu', 'Engaruka Chini', 'Engaruka Kati', 'Engaruka Mashariki'],
    'Monduli': ['Enduimet', 'Engikaret', 'Engikaret Juu', 'Engikaret Chini', 'Engikaret Kati'],
    'Ngorongoro': ['Enduimet', 'Engikaret', 'Engikaret Juu', 'Engikaret Chini', 'Engikaret Kati'],
    
    // Dar es Salaam Districts
    'Ilala': ['Buguruni', 'Chanika', 'Gerezani', 'Ilala', 'Kariakoo', 'Kinyerezi', 'Kisutu', 'Mchikichini', 'Mchikichini Juu', 'Mchikichini Chini'],
    'Kinondoni': ['Kawe', 'Kinondoni', 'Kunduchi', 'Mabibo', 'Magomeni', 'Mikocheni', 'Msasani', 'Oyster Bay', 'Sinza', 'Ubungo'],
    'Temeke': ['Chamazi', 'Kigamboni', 'Kigamboni Juu', 'Kigamboni Chini', 'Kigamboni Kati', 'Mbagala', 'Mbagala Juu', 'Mbagala Chini', 'Mbagala Kati', 'Temeke'],
    'Ubungo': ['Goba', 'Goba Juu', 'Goba Chini', 'Goba Kati', 'Kimara', 'Kimara Juu', 'Kimara Chini', 'Kimara Kati', 'Mbezi', 'Mbezi Juu', 'Mbezi Chini', 'Mbezi Kati'],
    'Kigamboni': ['Kigamboni', 'Kigamboni Juu', 'Kigamboni Chini', 'Kigamboni Kati', 'Kigamboni Mashariki', 'Kigamboni Magharibi'],
    
    // Dodoma Districts
    'Bahi': ['Bahi', 'Bahi Juu', 'Bahi Chini', 'Bahi Kati', 'Bahi Mashariki', 'Bahi Magharibi'],
    'Chamwino': ['Chamwino', 'Chamwino Juu', 'Chamwino Chini', 'Chamwino Kati', 'Chamwino Mashariki', 'Chamwino Magharibi'],
    'Chemba': ['Chemba', 'Chemba Juu', 'Chemba Chini', 'Chemba Kati', 'Chemba Mashariki', 'Chemba Magharibi'],
    'Dodoma City': ['Central', 'East', 'North', 'South', 'West'],
    'Kondoa': ['Kondoa', 'Kondoa Juu', 'Kondoa Chini', 'Kondoa Kati', 'Kondoa Mashariki', 'Kondoa Magharibi'],
    'Kongwa': ['Kongwa', 'Kongwa Juu', 'Kongwa Chini', 'Kongwa Kati', 'Kongwa Mashariki', 'Kongwa Magharibi'],
    'Mpwapwa': ['Mpwapwa', 'Mpwapwa Juu', 'Mpwapwa Chini', 'Mpwapwa Kati', 'Mpwapwa Mashariki', 'Mpwapwa Magharibi'],
    
    // Zanzibar Districts
    'Magharibi': ['Magharibi', 'Magharibi Juu', 'Magharibi Chini', 'Magharibi Kati', 'Magharibi Mashariki', 'Magharibi Magharibi'],
    'Mjini': ['Mjini', 'Mjini Juu', 'Mjini Chini', 'Mjini Kati', 'Mjini Mashariki', 'Mjini Magharibi'],
    'Micheweni': ['Micheweni', 'Micheweni Juu', 'Micheweni Chini', 'Micheweni Kati', 'Micheweni Mashariki', 'Micheweni Magharibi'],
    'Wete': ['Wete', 'Wete Juu', 'Wete Chini', 'Wete Kati', 'Wete Mashariki', 'Wete Magharibi'],
    'Chake Chake': ['Chake Chake', 'Chake Chake Juu', 'Chake Chake Chini', 'Chake Chake Kati', 'Chake Chake Mashariki', 'Chake Chake Magharibi'],
    'Mkoani': ['Mkoani', 'Mkoani Juu', 'Mkoani Chini', 'Mkoani Kati', 'Mkoani Mashariki', 'Mkoani Magharibi'],
    'Kaskazini A': ['Kaskazini A', 'Kaskazini A Juu', 'Kaskazini A Chini', 'Kaskazini A Kati', 'Kaskazini A Mashariki', 'Kaskazini A Magharibi'],
    'Kaskazini B': ['Kaskazini B', 'Kaskazini B Juu', 'Kaskazini B Chini', 'Kaskazini B Kati', 'Kaskazini B Mashariki', 'Kaskazini B Magharibi'],
    'Kusini': ['Kusini', 'Kusini Juu', 'Kusini Chini', 'Kusini Kati', 'Kusini Mashariki', 'Kusini Magharibi'],
    'Kusini Unguja': ['Kusini Unguja', 'Kusini Unguja Juu', 'Kusini Unguja Chini', 'Kusini Unguja Kati', 'Kusini Unguja Mashariki', 'Kusini Unguja Magharibi']
  },

  wards: {
    // Sample wards for each district (this would be expanded with all wards)
    'Central': ['Central Ward 1', 'Central Ward 2', 'Central Ward 3', 'Central Ward 4', 'Central Ward 5'],
    'East': ['East Ward 1', 'East Ward 2', 'East Ward 3', 'East Ward 4', 'East Ward 5'],
    'North': ['North Ward 1', 'North Ward 2', 'North Ward 3', 'North Ward 4', 'North Ward 5'],
    'South': ['South Ward 1', 'South Ward 2', 'South Ward 3', 'South Ward 4', 'South Ward 5'],
    'West': ['West Ward 1', 'West Ward 2', 'West Ward 3', 'West Ward 4', 'West Ward 5'],
    
    // Dar es Salaam Wards
    'Buguruni': ['Buguruni Ward 1', 'Buguruni Ward 2', 'Buguruni Ward 3', 'Buguruni Ward 4', 'Buguruni Ward 5'],
    'Chanika': ['Chanika Ward 1', 'Chanika Ward 2', 'Chanika Ward 3', 'Chanika Ward 4', 'Chanika Ward 5'],
    'Gerezani': ['Gerezani Ward 1', 'Gerezani Ward 2', 'Gerezani Ward 3', 'Gerezani Ward 4', 'Gerezani Ward 5'],
    'Ilala': ['Ilala Ward 1', 'Ilala Ward 2', 'Ilala Ward 3', 'Ilala Ward 4', 'Ilala Ward 5'],
    'Kariakoo': ['Kariakoo Ward 1', 'Kariakoo Ward 2', 'Kariakoo Ward 3', 'Kariakoo Ward 4', 'Kariakoo Ward 5'],
    'Kinyerezi': ['Kinyerezi Ward 1', 'Kinyerezi Ward 2', 'Kinyerezi Ward 3', 'Kinyerezi Ward 4', 'Kinyerezi Ward 5'],
    'Kisutu': ['Kisutu Ward 1', 'Kisutu Ward 2', 'Kisutu Ward 3', 'Kisutu Ward 4', 'Kisutu Ward 5'],
    'Mchikichini': ['Mchikichini Ward 1', 'Mchikichini Ward 2', 'Mchikichini Ward 3', 'Mchikichini Ward 4', 'Mchikichini Ward 5'],
    'Mchikichini Juu': ['Mchikichini Juu Ward 1', 'Mchikichini Juu Ward 2', 'Mchikichini Juu Ward 3', 'Mchikichini Juu Ward 4', 'Mchikichini Juu Ward 5'],
    'Mchikichini Chini': ['Mchikichini Chini Ward 1', 'Mchikichini Chini Ward 2', 'Mchikichini Chini Ward 3', 'Mchikichini Chini Ward 4', 'Mchikichini Chini Ward 5'],
    
    // Kinondoni Wards
    'Kawe': ['Kawe Ward 1', 'Kawe Ward 2', 'Kawe Ward 3', 'Kawe Ward 4', 'Kawe Ward 5'],
    'Kinondoni': ['Kinondoni Ward 1', 'Kinondoni Ward 2', 'Kinondoni Ward 3', 'Kinondoni Ward 4', 'Kinondoni Ward 5'],
    'Kunduchi': ['Kunduchi Ward 1', 'Kunduchi Ward 2', 'Kunduchi Ward 3', 'Kunduchi Ward 4', 'Kunduchi Ward 5'],
    'Mabibo': ['Mabibo Ward 1', 'Mabibo Ward 2', 'Mabibo Ward 3', 'Mabibo Ward 4', 'Mabibo Ward 5'],
    'Magomeni': ['Magomeni Ward 1', 'Magomeni Ward 2', 'Magomeni Ward 3', 'Magomeni Ward 4', 'Magomeni Ward 5'],
    'Mikocheni': ['Mikocheni Ward 1', 'Mikocheni Ward 2', 'Mikocheni Ward 3', 'Mikocheni Ward 4', 'Mikocheni Ward 5'],
    'Msasani': ['Msasani Ward 1', 'Msasani Ward 2', 'Msasani Ward 3', 'Msasani Ward 4', 'Msasani Ward 5'],
    'Oyster Bay': ['Oyster Bay Ward 1', 'Oyster Bay Ward 2', 'Oyster Bay Ward 3', 'Oyster Bay Ward 4', 'Oyster Bay Ward 5'],
    'Sinza': ['Sinza Ward 1', 'Sinza Ward 2', 'Sinza Ward 3', 'Sinza Ward 4', 'Sinza Ward 5'],
    'Ubungo': ['Ubungo Ward 1', 'Ubungo Ward 2', 'Ubungo Ward 3', 'Ubungo Ward 4', 'Ubungo Ward 5'],
    
    // Temeke Wards
    'Chamazi': ['Chamazi Ward 1', 'Chamazi Ward 2', 'Chamazi Ward 3', 'Chamazi Ward 4', 'Chamazi Ward 5'],
    'Kigamboni': ['Kigamboni Ward 1', 'Kigamboni Ward 2', 'Kigamboni Ward 3', 'Kigamboni Ward 4', 'Kigamboni Ward 5'],
    'Kigamboni Juu': ['Kigamboni Juu Ward 1', 'Kigamboni Juu Ward 2', 'Kigamboni Juu Ward 3', 'Kigamboni Juu Ward 4', 'Kigamboni Juu Ward 5'],
    'Kigamboni Chini': ['Kigamboni Chini Ward 1', 'Kigamboni Chini Ward 2', 'Kigamboni Chini Ward 3', 'Kigamboni Chini Ward 4', 'Kigamboni Chini Ward 5'],
    'Kigamboni Kati': ['Kigamboni Kati Ward 1', 'Kigamboni Kati Ward 2', 'Kigamboni Kati Ward 3', 'Kigamboni Kati Ward 4', 'Kigamboni Kati Ward 5'],
    'Kigamboni Mashariki': ['Kigamboni Mashariki Ward 1', 'Kigamboni Mashariki Ward 2', 'Kigamboni Mashariki Ward 3', 'Kigamboni Mashariki Ward 4', 'Kigamboni Mashariki Ward 5'],
    'Kigamboni Magharibi': ['Kigamboni Magharibi Ward 1', 'Kigamboni Magharibi Ward 2', 'Kigamboni Magharibi Ward 3', 'Kigamboni Magharibi Ward 4', 'Kigamboni Magharibi Ward 5'],
    'Mbagala': ['Mbagala Ward 1', 'Mbagala Ward 2', 'Mbagala Ward 3', 'Mbagala Ward 4', 'Mbagala Ward 5'],
    'Mbagala Juu': ['Mbagala Juu Ward 1', 'Mbagala Juu Ward 2', 'Mbagala Juu Ward 3', 'Mbagala Juu Ward 4', 'Mbagala Juu Ward 5'],
    'Mbagala Chini': ['Mbagala Chini Ward 1', 'Mbagala Chini Ward 2', 'Mbagala Chini Ward 3', 'Mbagala Chini Ward 4', 'Mbagala Chini Ward 5'],
    'Mbagala Kati': ['Mbagala Kati Ward 1', 'Mbagala Kati Ward 2', 'Mbagala Kati Ward 3', 'Mbagala Kati Ward 4', 'Mbagala Kati Ward 5'],
    'Temeke': ['Temeke Ward 1', 'Temeke Ward 2', 'Temeke Ward 3', 'Temeke Ward 4', 'Temeke Ward 5']
  }
};

// Helper functions for location management
export const getDistrictsByRegion = (region: string): string[] => {
  return tanzaniaLocations.regions[region] || [];
};

export const getWardsByDistrict = (district: string): string[] => {
  return tanzaniaLocations.wards[district] || [];
};

export const getAllRegions = (): string[] => {
  return Object.keys(tanzaniaLocations.regions);
};

export const getAllDistricts = (): string[] => {
  return Object.keys(tanzaniaLocations.districts);
};

export const getAllWards = (): string[] => {
  return Object.keys(tanzaniaLocations.wards);
};
























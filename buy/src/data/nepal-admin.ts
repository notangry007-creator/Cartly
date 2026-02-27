// Nepal Administrative Divisions
// Province → Districts → Municipalities (partial list of major ones)

export interface NepalDistrict {
  name: string;
  municipalities: string[];
}

export interface NepalProvince {
  id: string;
  name: string;
  districts: NepalDistrict[];
}

export const NEPAL_PROVINCES: NepalProvince[] = [
  {
    id: 'koshi',
    name: 'Koshi Province',
    districts: [
      { name: 'Taplejung', municipalities: ['Taplejung Municipality', 'Phungling Municipality', 'Sirijangha Rural Municipality'] },
      { name: 'Sankhuwasabha', municipalities: ['Chainpur Municipality', 'Dharmadevi Municipality', 'Khandbari Municipality'] },
      { name: 'Solukhumbu', municipalities: ['Solududhkunda Municipality', 'Salleri Municipality', 'Namche Rural Municipality'] },
      { name: 'Okhaldhunga', municipalities: ['Okhaldhunga Municipality', 'Siddhicharan Municipality'] },
      { name: 'Khotang', municipalities: ['Diktel Rupakot Majhuwagadhi Municipality', 'Halesi Tuwachung Municipality'] },
      { name: 'Bhojpur', municipalities: ['Bhojpur Municipality', 'Shadananda Municipality'] },
      { name: 'Dhankuta', municipalities: ['Dhankuta Municipality', 'Pakhribas Municipality'] },
      { name: 'Terhathum', municipalities: ['Myanglung Municipality', 'Laligurans Municipality'] },
      { name: 'Sunsari', municipalities: ['Inaruwa Municipality', 'Dharan Sub-Metropolitan City', 'Itahari Sub-Metropolitan City', 'Duhabi Municipality'] },
      { name: 'Morang', municipalities: ['Biratnagar Metropolitan City', 'Urlabari Municipality', 'Sundar Haraicha Municipality', 'Letang Bhogateni Municipality'] },
      { name: 'Jhapa', municipalities: ['Mechinagar Municipality', 'Bhadrapur Municipality', 'Birtamod Municipality', 'Damak Municipality', 'Kankai Municipality'] },
      { name: 'Ilam', municipalities: ['Ilam Municipality', 'Deumai Municipality', 'Mai Municipality'] },
      { name: 'Panchthar', municipalities: ['Phidim Municipality', 'Hilihang Rural Municipality'] },
    ],
  },
  {
    id: 'madhesh',
    name: 'Madhesh Province',
    districts: [
      { name: 'Saptari', municipalities: ['Rajbiraj Municipality', 'Kanchanrup Municipality', 'Shambhunath Municipality'] },
      { name: 'Siraha', municipalities: ['Siraha Municipality', 'Lahan Municipality', 'Dhangadhimai Municipality'] },
      { name: 'Dhanusha', municipalities: ['Janakpur Sub-Metropolitan City', 'Dhanusha Municipality', 'Mithila Municipality'] },
      { name: 'Mahottari', municipalities: ['Jaleshwar Municipality', 'Bardibas Municipality', 'Gaur Municipality'] },
      { name: 'Sarlahi', municipalities: ['Malangwa Municipality', 'Haripur Municipality', 'Ishworpur Municipality'] },
      { name: 'Rautahat', municipalities: ['Gaur Municipality', 'Chandrapur Municipality', 'Rajpur Municipality'] },
      { name: 'Bara', municipalities: ['Kalaiya Sub-Metropolitan City', 'Jitpur Simara Sub-Metropolitan City', 'Nijgadh Municipality'] },
      { name: 'Parsa', municipalities: ['Birgunj Metropolitan City', 'Pokhariya Municipality', 'Parsagadhi Municipality'] },
    ],
  },
  {
    id: 'bagmati',
    name: 'Bagmati Province',
    districts: [
      { name: 'Kathmandu', municipalities: ['Kathmandu Metropolitan City', 'Kirtipur Municipality', 'Chandragiri Municipality', 'Gokarneshwar Municipality', 'Kageshwari Manohara Municipality', 'Nagarjun Municipality', 'Shankharapur Municipality', 'Tarakeshwar Municipality', 'Tokha Municipality'] },
      { name: 'Lalitpur', municipalities: ['Lalitpur Metropolitan City', 'Godawari Municipality', 'Mahalaxmi Municipality', 'Konjyosom Rural Municipality'] },
      { name: 'Bhaktapur', municipalities: ['Bhaktapur Municipality', 'Changunarayan Municipality', 'Madhyapur Thimi Municipality', 'Suryabinayak Municipality'] },
      { name: 'Kavrepalanchok', municipalities: ['Banepa Municipality', 'Dhulikhel Municipality', 'Panauti Municipality', 'Panchkhal Municipality', 'Namobuddha Municipality'] },
      { name: 'Sindhupalchok', municipalities: ['Chautara Sangachokgadhi Municipality', 'Melamchi Municipality', 'Barhabise Municipality'] },
      { name: 'Dolakha', municipalities: ['Bhimeshwar Municipality', 'Jiri Municipality'] },
      { name: 'Ramechhap', municipalities: ['Manthali Municipality', 'Ramechhap Municipality'] },
      { name: 'Sindhuli', municipalities: ['Sindhuli Municipality', 'Kamalamai Municipality'] },
      { name: 'Makwanpur', municipalities: ['Hetauda Sub-Metropolitan City', 'Thaha Municipality', 'Manahari Rural Municipality'] },
      { name: 'Rasuwa', municipalities: ['Uttargaya Rural Municipality', 'Kalika Rural Municipality'] },
      { name: 'Nuwakot', municipalities: ['Bidur Municipality', 'Belkotgadhi Municipality', 'Dupcheshwar Rural Municipality'] },
      { name: 'Dhading', municipalities: ['Nilkantha Municipality', 'Dhading Besi Municipality'] },
      { name: 'Chitwan', municipalities: ['Bharatpur Metropolitan City', 'Ratnanagar Municipality', 'Khairahani Municipality', 'Madi Municipality'] },
    ],
  },
  {
    id: 'gandaki',
    name: 'Gandaki Province',
    districts: [
      { name: 'Kaski', municipalities: ['Pokhara Metropolitan City', 'Annapurna Rural Municipality', 'Machhapuchchhre Rural Municipality'] },
      { name: 'Syangja', municipalities: ['Waling Municipality', 'Putalibazar Municipality', 'Galyang Municipality'] },
      { name: 'Tanahun', municipalities: ['Damauli Municipality', 'Bhimad Municipality', 'Byas Municipality'] },
      { name: 'Lamjung', municipalities: ['Besisahar Municipality', 'Sundarbazar Municipality'] },
      { name: 'Gorkha', municipalities: ['Gorkha Municipality', 'Palungtar Municipality'] },
      { name: 'Manang', municipalities: ['Chame Rural Municipality', 'Narpa Bhumi Rural Municipality'] },
      { name: 'Mustang', municipalities: ['Mustang Rural Municipality', 'Thasang Rural Municipality', 'Gharapjhong Rural Municipality'] },
      { name: 'Myagdi', municipalities: ['Beni Municipality', 'Malika Rural Municipality'] },
      { name: 'Parbat', municipalities: ['Kushma Municipality', 'Phalewas Municipality'] },
      { name: 'Baglung', municipalities: ['Baglung Municipality', 'Dhorpatan Municipality'] },
      { name: 'Nawalpur', municipalities: ['Kawasoti Municipality', 'Gaindakot Municipality', 'Madhyabindu Municipality'] },
    ],
  },
  {
    id: 'lumbini',
    name: 'Lumbini Province',
    districts: [
      { name: 'Rupandehi', municipalities: ['Butwal Sub-Metropolitan City', 'Siddharthanagar Municipality', 'Tilottama Municipality', 'Devdaha Municipality', 'Lumbini Sanskritik Municipality'] },
      { name: 'Kapilvastu', municipalities: ['Kapilvastu Municipality', 'Banganga Municipality', 'Buddhabhumi Municipality'] },
      { name: 'Nawalparasi (East)', municipalities: ['Sunwal Municipality', 'Palhinandan Rural Municipality'] },
      { name: 'Arghakhanchi', municipalities: ['Sandhikharka Municipality', 'Sitganga Municipality'] },
      { name: 'Gulmi', municipalities: ['Resunga Municipality', 'Musikot Municipality'] },
      { name: 'Palpa', municipalities: ['Tansen Municipality', 'Rampur Municipality'] },
      { name: 'Dang', municipalities: ['Tulsipur Sub-Metropolitan City', 'Ghorahi Sub-Metropolitan City', 'Lamahi Municipality'] },
      { name: 'Banke', municipalities: ['Nepalgunj Sub-Metropolitan City', 'Kohalpur Municipality', 'Rapti Sonari Municipality'] },
      { name: 'Bardiya', municipalities: ['Gulariya Municipality', 'Rajapur Municipality', 'Thakurbaba Municipality'] },
      { name: 'Pyuthan', municipalities: ['Pyuthan Municipality', 'Swargadwari Municipality'] },
      { name: 'Rolpa', municipalities: ['Rolpa Municipality', 'Runtigadhi Rural Municipality'] },
    ],
  },
  {
    id: 'karnali',
    name: 'Karnali Province',
    districts: [
      { name: 'Surkhet', municipalities: ['Birendranagar Municipality', 'Bheriganga Municipality', 'Gurbhakot Municipality'] },
      { name: 'Dailekh', municipalities: ['Narayan Municipality', 'Dullu Municipality', 'Chamunda Bindrasaini Municipality'] },
      { name: 'Jajarkot', municipalities: ['Bheri Municipality', 'Chhedagad Municipality'] },
      { name: 'Rukum (East)', municipalities: ['Putha Uttarganga Rural Municipality', 'Sisne Rural Municipality'] },
      { name: 'Salyan', municipalities: ['Sharada Municipality', 'Bangad Kupinde Municipality'] },
      { name: 'Dolpa', municipalities: ['Thuli Bheri Municipality', 'Tripurasundari Municipality'] },
      { name: 'Humla', municipalities: ['Simkot Rural Municipality', 'Chankheli Rural Municipality'] },
      { name: 'Jumla', municipalities: ['Chandannath Municipality', 'Tatopani Rural Municipality'] },
      { name: 'Kalikot', municipalities: ['Khandachakra Municipality', 'Raskot Municipality'] },
      { name: 'Mugu', municipalities: ['Chhayanath Rara Municipality', 'Mugum Karmarong Rural Municipality'] },
    ],
  },
  {
    id: 'sudurpashchim',
    name: 'Sudurpashchim Province',
    districts: [
      { name: 'Kailali', municipalities: ['Dhangadhi Sub-Metropolitan City', 'Tikapur Municipality', 'Lamki Chuha Municipality', 'Bhajani Municipality'] },
      { name: 'Kanchanpur', municipalities: ['Bhimdatta Municipality', 'Shuklaphanta Municipality', 'Bedkot Municipality'] },
      { name: 'Dadeldhura', municipalities: ['Amargadhi Municipality', 'Parashuram Municipality'] },
      { name: 'Baitadi', municipalities: ['Dasharathchand Municipality', 'Patan Municipality'] },
      { name: 'Darchula', municipalities: ['Shailyashikhar Municipality', 'Duhun Rural Municipality'] },
      { name: 'Bajhang', municipalities: ['Jayaprithvi Municipality', 'Bungal Municipality'] },
      { name: 'Bajura', municipalities: ['Badimalika Municipality', 'Triveni Municipality'] },
      { name: 'Achham', municipalities: ['Mangalsen Municipality', 'Sanphebagar Municipality'] },
      { name: 'Doti', municipalities: ['Dipayal Silgadhi Municipality', 'Shikhar Municipality'] },
    ],
  },
];

export function getProvinceNames(): string[] {
  return NEPAL_PROVINCES.map(p => p.name);
}

export function getDistrictsForProvince(provinceName: string): string[] {
  const province = NEPAL_PROVINCES.find(p => p.name === provinceName);
  return province ? province.districts.map(d => d.name) : [];
}

export function getMunicipalitiesForDistrict(provinceName: string, districtName: string): string[] {
  const province = NEPAL_PROVINCES.find(p => p.name === provinceName);
  if (!province) return [];
  const district = province.districts.find(d => d.name === districtName);
  return district ? district.municipalities : [];
}

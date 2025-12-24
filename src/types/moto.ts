export interface FuelRecord {
  id: string;
  date: string;
  liters: number;
  price: number;
  totalCost: number;
  odometer: number;
  fuelType: 'gasoline' | 'diesel' | 'premium';
  station?: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'oil_change' | 'tire' | 'brake' | 'chain' | 'filter' | 'spark_plug' | 'battery' | 'general' | 'other';
  description: string;
  cost: number;
  odometer: number;
  nextDueOdometer?: number;
  nextDueDate?: string;
  shop?: string;
  notes?: string;
}

export interface PartRecord {
  id: string;
  name: string;
  category: 'engine' | 'brakes' | 'suspension' | 'electrical' | 'body' | 'tires' | 'other';
  purchaseDate: string;
  price: number;
  installDate?: string;
  brand?: string;
  partNumber?: string;
  warranty?: string;
  notes?: string;
}

export interface MotoProfile {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  currentOdometer: number;
  licensePlate?: string;
  vin?: string;
  purchaseDate?: string;
  color?: string;
}

export type MaintenanceType = MaintenanceRecord['type'];
export type PartCategory = PartRecord['category'];
export type FuelType = FuelRecord['fuelType'];

export const MAINTENANCE_TYPES: Record<MaintenanceType, string> = {
  oil_change: 'Cambio Olio',
  tire: 'Pneumatici',
  brake: 'Freni',
  chain: 'Catena',
  filter: 'Filtri',
  spark_plug: 'Candele',
  battery: 'Batteria',
  general: 'Generale',
  other: 'Altro',
};

export const PART_CATEGORIES: Record<PartCategory, string> = {
  engine: 'Motore',
  brakes: 'Freni',
  suspension: 'Sospensioni',
  electrical: 'Elettrica',
  body: 'Carrozzeria',
  tires: 'Gomme',
  other: 'Altro',
};

export const FUEL_TYPES: Record<FuelType, string> = {
  gasoline: 'Benzina',
  diesel: 'Diesel',
  premium: 'Super',
};

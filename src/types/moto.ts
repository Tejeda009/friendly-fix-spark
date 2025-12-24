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

export interface CorePart {
  id: string;
  type: CorePartType;
  lastServiceDate: string;
  lastServiceOdometer: number;
  intervalKm: number;
  intervalMonths: number;
  brand?: string;
  notes?: string;
}

export type MaintenanceType = MaintenanceRecord['type'];
export type PartCategory = PartRecord['category'];
export type FuelType = FuelRecord['fuelType'];
export type CorePartType = 
  | 'engine_oil' 
  | 'oil_filter' 
  | 'air_filter' 
  | 'spark_plugs' 
  | 'brake_pads_front' 
  | 'brake_pads_rear' 
  | 'brake_fluid' 
  | 'coolant' 
  | 'chain' 
  | 'sprockets' 
  | 'tires_front' 
  | 'tires_rear' 
  | 'battery' 
  | 'fork_oil' 
  | 'valve_clearance';

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

export const CORE_PART_TYPES: Record<CorePartType, string> = {
  engine_oil: 'Olio Motore',
  oil_filter: 'Filtro Olio',
  air_filter: 'Filtro Aria',
  spark_plugs: 'Candele',
  brake_pads_front: 'Pastiglie Freno Ant.',
  brake_pads_rear: 'Pastiglie Freno Post.',
  brake_fluid: 'Liquido Freni',
  coolant: 'Liquido Raffreddamento',
  chain: 'Catena',
  sprockets: 'Corona e Pignone',
  tires_front: 'Gomma Anteriore',
  tires_rear: 'Gomma Posteriore',
  battery: 'Batteria',
  fork_oil: 'Olio Forcelle',
  valve_clearance: 'Registro Valvole',
};

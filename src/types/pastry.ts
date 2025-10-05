export interface Ingredients {
  flour: number; // cups
  powderedMilk: number; // cups
  pinipig: number; // cups
  butter: number; // cups
  sugar: number; // cups
}

export interface IngredientCosts {
  flour: number; // per cup
  powderedMilk: number;
  pinipig: number;
  butter: number;
  sugar: number;
}

export type Channel = 'wholesale' | 'events' | 'online';

export type FlavorType = 'brown-butter-bites' | 'milo' | 'lolas-mix' | 'cinnamon';

export interface FlavorQuantity {
  flavor: FlavorType;
  quantity: number;
  pricePerBatch: number;
}

export interface Order {
  id: string;
  name: string;
  quantity: number; // total number of orders (10 pastries each)
  channel: Channel;
  week: string; // ISO week format (for display)
  dueDate: string; // ISO date format (YYYY-MM-DD)
  pricePerBatch: number; // average price per batch (calculated from flavors)
  laborHours: number;
  status: 'pending' | 'approved' | 'rejected';
  flavors?: FlavorQuantity[]; // flavor breakdown
  miscCosts?: number; // miscellaneous costs for events (vendor fees, permits, etc.)
}

export interface ROIMetrics {
  revenue: number;
  materialCost: number;
  laborCost: number;
  shippingCost: number;
  miscCosts: number;
  profit: number;
  roi: number; // percentage
  profitPerHour: number;
}

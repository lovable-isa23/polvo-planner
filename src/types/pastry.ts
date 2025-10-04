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

export interface Order {
  id: string;
  name: string;
  quantity: number; // number of orders (10 pastries each)
  channel: Channel;
  week: string; // ISO week format
  pricePerBatch: number;
  laborHours: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ROIMetrics {
  revenue: number;
  materialCost: number;
  laborCost: number;
  profit: number;
  roi: number; // percentage
  profitPerHour: number;
}

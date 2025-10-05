import { Ingredients, IngredientCosts, Order, ROIMetrics } from '@/types/pastry';

// Default recipe for 10 pastries (1 order)
export const DEFAULT_RECIPE: Ingredients = {
  flour: 4,
  powderedMilk: 2,
  pinipig: 0.75,
  butter: 1.2,
  sugar: 1.5,
};

// Default ingredient costs (per cup)
export const DEFAULT_INGREDIENT_COSTS: IngredientCosts = {
  flour: 0.30,
  powderedMilk: 1.20,
  pinipig: 1.50,
  butter: 2.00,
  sugar: 0.50,
};

export const DEFAULT_LABOR_RATE = 22; // per hour
export const SHIPPING_COST_PER_ORDER = 15; // for wholesale orders < 10 batches
export const PRODUCTION_RATE = 80; // polvorons per hour per person (1200 polvorons / 15 hours)

export function getRecipe(): Ingredients {
  const saved = localStorage.getItem('recipe');
  return saved ? JSON.parse(saved) : DEFAULT_RECIPE;
}

export function getCosts(): IngredientCosts {
  const saved = localStorage.getItem('costs');
  return saved ? JSON.parse(saved) : DEFAULT_INGREDIENT_COSTS;
}

export function getLaborRate(): number {
  const saved = localStorage.getItem('laborRate');
  return saved ? parseFloat(saved) : DEFAULT_LABOR_RATE;
}

export function calculateMaterialCost(
  orders: number,
  recipe?: Ingredients,
  costs?: IngredientCosts
): number {
  const actualRecipe = recipe || getRecipe();
  const actualCosts = costs || getCosts();
  
  const costPerOrder =
    actualRecipe.flour * actualCosts.flour +
    actualRecipe.powderedMilk * actualCosts.powderedMilk +
    actualRecipe.pinipig * actualCosts.pinipig +
    actualRecipe.butter * actualCosts.butter +
    actualRecipe.sugar * actualCosts.sugar;
  
  return costPerOrder * orders;
}

export function calculateROI(order: Order): ROIMetrics {
  // Calculate revenue from flavors if available, otherwise use pricePerBatch
  let revenue: number;
  if (order.flavors && order.flavors.length > 0) {
    revenue = order.flavors.reduce((sum, f) => sum + (f.quantity * f.pricePerBatch), 0);
  } else {
    revenue = order.quantity * order.pricePerBatch;
  }
  
  const materialCost = calculateMaterialCost(order.quantity);
  const laborCost = order.laborHours * getLaborRate();
  
  // Calculate shipping cost for online orders with less than 10 batches
  const shippingCost = (order.channel === 'online' && order.quantity < 10) ? SHIPPING_COST_PER_ORDER : 0;
  
  // Miscellaneous costs for events (vendor fees, permits, etc.)
  const miscCosts = order.miscCosts || 0;
  
  const totalCosts = materialCost + laborCost + shippingCost + miscCosts;
  const profit = revenue - totalCosts;
  const roi = totalCosts > 0 ? ((profit / totalCosts) * 100) : 0;
  const profitPerHour = order.laborHours > 0 ? profit / order.laborHours : 0;

  return {
    revenue,
    materialCost,
    laborCost,
    shippingCost,
    miscCosts,
    profit,
    roi,
    profitPerHour,
  };
}

export function calculateLaborHours(totalPolvorons: number): number {
  // Each batch is 10 polvorons
  // Production rate is 80 polvorons/hour per person
  // Workers work 4-hour shifts, so we calculate total hours needed
  const hoursNeeded = totalPolvorons / PRODUCTION_RATE;
  
  // Round up to nearest 0.5 hour increment
  return Math.ceil(hoursNeeded * 2) / 2;
}

export function getROIColor(roi: number): string {
  if (roi < 0) return 'hsl(var(--roi-critical))';
  if (roi < 20) return 'hsl(var(--roi-poor))';
  if (roi < 40) return 'hsl(var(--roi-fair))';
  if (roi < 60) return 'hsl(var(--roi-good))';
  return 'hsl(var(--roi-excellent))';
}

export function getROILabel(roi: number): string {
  if (roi < 0) return 'Critical';
  if (roi < 20) return 'Poor';
  if (roi < 40) return 'Fair';
  if (roi < 60) return 'Good';
  return 'Excellent';
}

export function calculateWeeklyProfits(orders: Order[]): { [week: string]: number } {
  const weeklyProfits: { [week: string]: number } = {};

  orders.forEach(order => {
    const roiMetrics = calculateROI(order);
    const week = order.week;
    if (!weeklyProfits[week]) {
      weeklyProfits[week] = 0;
    }
    weeklyProfits[week] += roiMetrics.profit;
  });

  return weeklyProfits;
}

export function calculateAverageROI(orders: Order[]): number {
  if (orders.length === 0) {
    return 0;
  }

  const totalROI = orders.reduce((acc, order) => {
    const roiMetrics = calculateROI(order);
    return acc + roiMetrics.roi;
  }, 0);

  return totalROI / orders.length;
}


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

export const DEFAULT_LABOR_RATE = 15; // per hour
export const DEFAULT_PRICE_PER_ORDER = 10;

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

export function getPricePerOrder(): number {
  const saved = localStorage.getItem('pricePerOrder');
  return saved ? parseFloat(saved) : DEFAULT_PRICE_PER_ORDER;
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
  const revenue = order.quantity * order.pricePerBatch;
  const materialCost = calculateMaterialCost(order.quantity);
  const laborCost = order.laborHours * getLaborRate();
  const profit = revenue - materialCost - laborCost;
  const roi = ((profit / (materialCost + laborCost)) * 100);
  const profitPerHour = order.laborHours > 0 ? profit / order.laborHours : 0;

  return {
    revenue,
    materialCost,
    laborCost,
    profit,
    roi,
    profitPerHour,
  };
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

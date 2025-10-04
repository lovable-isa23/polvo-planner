import { Ingredients, IngredientCosts, Order, ROIMetrics } from '@/types/pastry';

// Default recipe for 10 pastries (1 order)
export const DEFAULT_RECIPE: Ingredients = {
  flour: 4,
  powderedMilk: 0.8,
  pinipig: 5,
  butter: 0.9,
  sugar: 0.75,
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

export function calculateMaterialCost(
  orders: number,
  recipe: Ingredients = DEFAULT_RECIPE,
  costs: IngredientCosts = DEFAULT_INGREDIENT_COSTS
): number {
  const costPerOrder =
    recipe.flour * costs.flour +
    recipe.powderedMilk * costs.powderedMilk +
    recipe.pinipig * costs.pinipig +
    recipe.butter * costs.butter +
    recipe.sugar * costs.sugar;
  
  return costPerOrder * orders;
}

export function calculateROI(order: Order): ROIMetrics {
  const revenue = order.quantity * order.pricePerBatch;
  const materialCost = calculateMaterialCost(order.quantity);
  const laborCost = order.laborHours * DEFAULT_LABOR_RATE;
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

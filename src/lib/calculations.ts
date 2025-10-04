import { Ingredients, IngredientCosts, Order, ROIMetrics } from '@/types/pastry';

// Default recipe for 10 pastries (1 batch)
export const DEFAULT_RECIPE: Ingredients = {
  flour: 500,
  powderedMilk: 100,
  pinipig: 150,
  butter: 200,
  sugar: 150,
};

// Default ingredient costs (per gram)
export const DEFAULT_INGREDIENT_COSTS: IngredientCosts = {
  flour: 0.05,
  powderedMilk: 0.15,
  pinipig: 0.20,
  butter: 0.30,
  sugar: 0.08,
};

export const DEFAULT_LABOR_RATE = 150; // per hour

export function calculateMaterialCost(
  batches: number,
  recipe: Ingredients = DEFAULT_RECIPE,
  costs: IngredientCosts = DEFAULT_INGREDIENT_COSTS
): number {
  const costPerBatch =
    recipe.flour * costs.flour +
    recipe.powderedMilk * costs.powderedMilk +
    recipe.pinipig * costs.pinipig +
    recipe.butter * costs.butter +
    recipe.sugar * costs.sugar;
  
  return costPerBatch * batches;
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

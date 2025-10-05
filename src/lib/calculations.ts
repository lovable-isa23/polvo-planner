import { Ingredients, IngredientCosts, Order, ROIMetrics } from '@/types/pastry';

/**
 * Default recipe for 10 pastries (1 order/batch).
 * This serves as a baseline for cost calculations when no other recipe is provided.
 * Units are based on a standard measure (e.g., cups, grams) consistent with ingredient costs.
 */
export const DEFAULT_RECIPE: Ingredients = {
  flour: 4,
  powderedMilk: 2,
  pinipig: 0.75,
  butter: 1.2,
  sugar: 1.5,
};

/**
 * Default costs for each ingredient, typically per standard unit (e.g., per cup).
 * Used in material cost calculations.
 */
export const DEFAULT_INGREDIENT_COSTS: IngredientCosts = {
  flour: 0.30,
  powderedMilk: 1.20,
  pinipig: 1.50,
  butter: 2.00,
  sugar: 0.50,
};

/**
 * Default hourly wage for labor. Used to calculate the labor cost component of an order.
 */
export const DEFAULT_LABOR_RATE = 22; // per hour

/**
 * A flat shipping fee applied to wholesale orders under a certain size threshold.
 * This helps account for logistics costs on smaller wholesale transactions.
 */
export const SHIPPING_COST_PER_ORDER = 15; // for wholesale orders < 10 batches

/**
 * The standard production rate, measured in individual polvorons produced per hour by one person.
 * This is derived from historical data (e.g., 1200 polvorons over 15 hours).
 */
export const PRODUCTION_RATE = 80; // polvorons per hour per person

/**
 * Retrieves the recipe from localStorage, falling back to the default if none is saved.
 * This allows for user-customizable recipes.
 * @returns {Ingredients} The active recipe configuration.
 */
export function getRecipe(): Ingredients {
  const saved = localStorage.getItem('recipe');
  return saved ? JSON.parse(saved) : DEFAULT_RECIPE;
}

/**
 * Retrieves ingredient costs from localStorage, falling back to defaults if none are saved.
 * This allows for dynamic pricing based on current supplier costs.
 * @returns {IngredientCosts} The active ingredient cost configuration.
 */
export function getCosts(): IngredientCosts {
  const saved = localStorage.getItem('costs');
  return saved ? JSON.parse(saved) : DEFAULT_INGREDIENT_COSTS;
}

/**
 * Retrieves the labor rate from localStorage, falling back to the default if none is saved.
 * @returns {number} The active labor rate.
 */
export function getLaborRate(): number {
  const saved = localStorage.getItem('laborRate');
  return saved ? parseFloat(saved) : DEFAULT_LABOR_RATE;
}

/**
 * Calculates the total material cost for a given number of orders (batches).
 * @param {number} orders - The number of batches to calculate the cost for.
 * @param {Ingredients} [recipe] - Optional custom recipe to use for the calculation.
 * @param {IngredientCosts} [costs] - Optional custom ingredient costs to use.
 * @returns {number} The total material cost.
 */
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

/**
 * Calculates a comprehensive set of Return on Investment (ROI) metrics for a single order.
 * This function is central to the decision-making process, providing a financial snapshot of an order's viability.
 * @param {Order} order - The order to analyze.
 * @returns {ROIMetrics} A collection of financial metrics for the order.
 */
export function calculateROI(order: Order): ROIMetrics {
  // Revenue can be calculated from a detailed flavor breakdown or a simple batch price.
  let revenue: number;
  if (order.flavors && order.flavors.length > 0) {
    revenue = order.flavors.reduce((sum, f) => sum + (f.quantity * f.pricePerBatch), 0);
  } else {
    revenue = order.quantity * order.pricePerBatch;
  }
  
  const materialCost = calculateMaterialCost(order.quantity);
  const laborCost = order.laborHours * getLaborRate();
  
  // Apply shipping costs for smaller online orders.
  const shippingCost = (order.channel === 'online' && order.quantity < 10) ? SHIPPING_COST_PER_ORDER : 0;
  
  // Include any one-off costs associated with the order (e.g., event vendor fees).
  const miscCosts = order.miscCosts || 0;
  
  const totalCosts = materialCost + laborCost + shippingCost + miscCosts;
  const profit = revenue - totalCosts;
  // ROI is calculated as (Profit / Total Costs). If costs are zero, ROI is considered zero to avoid division by zero.
  const roi = totalCosts > 0 ? ((profit / totalCosts) * 100) : 0;
  // Profit per hour provides an efficiency metric.
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

/**
 * Calculates the total labor hours required to produce a given number of polvorons.
 * The calculation is based on a standard production rate and rounds up to the nearest half-hour to reflect realistic scheduling.
 * @param {number} totalPolvorons - The total number of individual pastries to produce.
 * @returns {number} The estimated labor hours required.
 */
export function calculateLaborHours(totalPolvorons: number): number {
  const hoursNeeded = totalPolvorons / PRODUCTION_RATE;
  
  // Round up to the nearest 0.5 hour increment to account for practical work shifts.
  return Math.ceil(hoursNeeded * 2) / 2;
}

/**
 * Determines the color code for a given ROI value, used for visual indicators in the UI.
 * @param {number} roi - The ROI percentage.
 * @returns {string} A CSS HSL color variable name.
 */
export function getROIColor(roi: number): string {
  if (roi < 0) return 'hsl(var(--roi-critical))';
  if (roi < 20) return 'hsl(var(--roi-poor))';
  if (roi < 40) return 'hsl(var(--roi-fair))';
  if (roi < 60) return 'hsl(var(--roi-good))';
  return 'hsl(var(--roi-excellent))';
}

/**
 * Gets a human-readable label for a given ROI value.
 * @param {number} roi - The ROI percentage.
 * @returns {string} A descriptive label for the ROI level.
 */
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

import { useState, useEffect } from 'react';
import { Ingredients, IngredientCosts } from '@/types/pastry';
import { DEFAULT_RECIPE, DEFAULT_INGREDIENT_COSTS, DEFAULT_LABOR_RATE, DEFAULT_PRICE_PER_ORDER } from '@/lib/calculations';

export function useSettings() {
  const [recipe, setRecipe] = useState<Ingredients>(DEFAULT_RECIPE);
  const [costs, setCosts] = useState<IngredientCosts>(DEFAULT_INGREDIENT_COSTS);
  const [laborRate, setLaborRate] = useState(DEFAULT_LABOR_RATE);
  const [pricePerOrder, setPricePerOrder] = useState(DEFAULT_PRICE_PER_ORDER);

  useEffect(() => {
    const savedRecipe = localStorage.getItem('recipe');
    const savedCosts = localStorage.getItem('costs');
    const savedLaborRate = localStorage.getItem('laborRate');
    const savedPricePerOrder = localStorage.getItem('pricePerOrder');
    
    if (savedRecipe) setRecipe(JSON.parse(savedRecipe));
    if (savedCosts) setCosts(JSON.parse(savedCosts));
    if (savedLaborRate) setLaborRate(parseFloat(savedLaborRate));
    if (savedPricePerOrder) setPricePerOrder(parseFloat(savedPricePerOrder));
  }, []);

  return {
    recipe,
    costs,
    laborRate,
    pricePerOrder,
  };
}

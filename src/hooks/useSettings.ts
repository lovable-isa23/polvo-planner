import { useState, useEffect } from 'react';
import { Ingredients, IngredientCosts } from '@/types/pastry';
import { DEFAULT_RECIPE, DEFAULT_INGREDIENT_COSTS, DEFAULT_LABOR_RATE } from '@/lib/calculations';

export function useSettings() {
  const [recipe, setRecipe] = useState<Ingredients>(DEFAULT_RECIPE);
  const [costs, setCosts] = useState<IngredientCosts>(DEFAULT_INGREDIENT_COSTS);
  const [laborRate, setLaborRate] = useState(DEFAULT_LABOR_RATE);

  useEffect(() => {
    const savedRecipe = localStorage.getItem('recipe');
    const savedCosts = localStorage.getItem('costs');
    const savedLaborRate = localStorage.getItem('laborRate');
    
    if (savedRecipe) setRecipe(JSON.parse(savedRecipe));
    if (savedCosts) setCosts(JSON.parse(savedCosts));
    if (savedLaborRate) setLaborRate(parseFloat(savedLaborRate));
  }, []);

  return {
    recipe,
    costs,
    laborRate,
  };
}

import { useState, useEffect } from 'react';
import { Order } from '@/types/pastry';
import { calculateROI, DEFAULT_RECIPE, DEFAULT_INGREDIENT_COSTS, DEFAULT_LABOR_RATE } from '@/lib/calculations';
import { getROIColor, getROILabel } from '@/lib/calculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/useSettings';

interface ROIBreakdownProps {
  order: Order;
  compact?: boolean;
  editable?: boolean;
}

export function ROIBreakdown({ order, compact = false, editable = false }: ROIBreakdownProps) {
  const metrics = calculateROI(order);
  const roiColor = getROIColor(metrics.roi);
  const roiLabel = getROILabel(metrics.roi);

  const { recipe, costs, laborRate, pricePerOrder } = useSettings();

  // to add custom ingredient costs and amounts...
  // find a way to capture previewOrder from OrderCalculator
  // perhaps lift state up to a parent component?
  // or use a context to share state between components?
  // find a way to pass down custom recipe and costs as props?

  // Since RIOBreakdown is also used when viewing existing orders
  // must conditionally render inputs only when previewing a new order

  // Calculate individual ingredient costs
  const ingredientBreakdownDefault = [
    {
      name: 'All-Purpose Flour',
      amount: recipe.flour * order.quantity,
      unit: 'cups',
      costPerUnit: costs.flour,
      total: recipe.flour * order.quantity * costs.flour,
    },
    {
      name: 'Powdered Milk',
      amount: recipe.powderedMilk * order.quantity,
      unit: 'cups',
      costPerUnit: costs.powderedMilk,
      total: recipe.powderedMilk * order.quantity * costs.powderedMilk,
    },
    {
      name: 'Pinipig',
      amount: recipe.pinipig * order.quantity,
      unit: 'cups',
      costPerUnit: costs.pinipig,
      total: recipe.pinipig * order.quantity * costs.pinipig,
    },
    {
      name: 'Butter',
      amount: recipe.butter * order.quantity,
      unit: 'cups',
      costPerUnit: costs.butter,
      total: recipe.butter * order.quantity * costs.butter,
    },
    {
      name: 'Granulated Sugar',
      amount: recipe.sugar * order.quantity,
      unit: 'cups',
      costPerUnit: costs.sugar,
      total: recipe.sugar * order.quantity * costs.sugar,
    },
  ];

  const [ingredientBreakdown, setIngredients] = useState(ingredientBreakdownDefault);
  const setIngredientAmount = (name: string, amount: number) => {
    setIngredients((prev) =>
      prev.map((ingr) =>
        ingr.name === name ? { ...ingr, amount } : ingr
      )
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">ROI</span>
          <span className="text-sm font-semibold" style={{ color: roiColor }}>
            {metrics.roi.toFixed(1)}% ({roiLabel})
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Revenue</p>
            <p className="font-semibold">${metrics.revenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Profit</p>
            <p className="font-semibold" style={{ color: roiColor }}>${metrics.profit.toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        className="p-4 rounded-lg border-2 relative overflow-hidden"
        style={{ 
          borderColor: roiColor 
        }}
      >
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            background: `linear-gradient(135deg, 
              hsl(0, 100%, 50%) 0%, 
              hsl(30, 100%, 50%) 25%, 
              hsl(60, 100%, 50%) 50%, 
              hsl(90, 100%, 50%) 75%, 
              hsl(120, 100%, 50%) 100%)`,
            maskImage: `linear-gradient(to right, transparent 0%, black ${metrics.roi < 0 ? 0 : (metrics.roi / 100) * 100}%, transparent ${metrics.roi < 0 ? 0 : (metrics.roi / 100) * 100}%)`,
            WebkitMaskImage: `linear-gradient(to right, transparent 0%, black ${metrics.roi < 0 ? 0 : (metrics.roi / 100) * 100}%, transparent ${metrics.roi < 0 ? 0 : (metrics.roi / 100) * 100}%)`
          }}
        />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">ROI Summary</h4>
            <span className="text-lg font-bold" style={{ color: roiColor }}>
              {metrics.roi.toFixed(1)}% ({roiLabel})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Revenue</p>
              <p className="font-semibold">${metrics.revenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Costs</p>
              <p className="font-semibold">${(metrics.materialCost + metrics.laborCost).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Profit</p>
              <p className="font-semibold" style={{ color: roiColor }}>${metrics.profit.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Profit/Hour</p>
              <p className="font-semibold">${metrics.profitPerHour.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Material Cost Breakdown</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Cost/cup</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientBreakdownDefault.map((ingredient, index) => (
                <TableRow key={ingredient.name}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  { !editable ? (<TableCell className="text-right">{ingredient.amount.toFixed(2)} {ingredient.unit}</TableCell>)
                    : (<TableCell className="text-right">
                      <Input
                        id="labor"
                        type="number"
                        min="0"
                        step="0.25"
                        style={{ padding: '0', fontSize: '12px', textAlign: 'right' }}
                        value={ingredientBreakdown[index].amount}
                        onChange={(e) => setIngredientAmount(ingredientBreakdown[index].name, Number(e.target.value))}
                      />
                      {` ${ingredient.unit}`}
                    </TableCell>)
                  }
                  <TableCell className="text-right">${ingredient.costPerUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${ingredient.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={3}>Total Materials</TableCell>
                <TableCell className="text-right">${metrics.materialCost.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Labor Cost Breakdown</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Rate/Hour</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Labor ({order.quantity} orders)</TableCell>
                <TableCell className="text-right">{order.laborHours}h</TableCell>
                <TableCell className="text-right">${laborRate.toFixed(2)}</TableCell>
                <TableCell className="text-right">${metrics.laborCost.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={3}>Total Labor</TableCell>
                <TableCell className="text-right">${metrics.laborCost.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

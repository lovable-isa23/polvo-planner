import { Order } from '@/types/pastry';
import { calculateROI, DEFAULT_RECIPE, DEFAULT_INGREDIENT_COSTS, DEFAULT_LABOR_RATE } from '@/lib/calculations';
import { getROIColor, getROILabel } from '@/lib/calculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ROIBreakdownProps {
  order: Order;
  compact?: boolean;
}

export function ROIBreakdown({ order, compact = false }: ROIBreakdownProps) {
  const metrics = calculateROI(order);
  const roiColor = getROIColor(metrics.roi);
  const roiLabel = getROILabel(metrics.roi);

  // Calculate individual ingredient costs
  const ingredientBreakdown = [
    {
      name: 'All-Purpose Flour',
      amount: DEFAULT_RECIPE.flour * order.quantity,
      unit: 'g',
      costPerUnit: DEFAULT_INGREDIENT_COSTS.flour,
      total: DEFAULT_RECIPE.flour * order.quantity * DEFAULT_INGREDIENT_COSTS.flour,
    },
    {
      name: 'Powdered Milk',
      amount: DEFAULT_RECIPE.powderedMilk * order.quantity,
      unit: 'g',
      costPerUnit: DEFAULT_INGREDIENT_COSTS.powderedMilk,
      total: DEFAULT_RECIPE.powderedMilk * order.quantity * DEFAULT_INGREDIENT_COSTS.powderedMilk,
    },
    {
      name: 'Pinipig',
      amount: DEFAULT_RECIPE.pinipig * order.quantity,
      unit: 'g',
      costPerUnit: DEFAULT_INGREDIENT_COSTS.pinipig,
      total: DEFAULT_RECIPE.pinipig * order.quantity * DEFAULT_INGREDIENT_COSTS.pinipig,
    },
    {
      name: 'Butter',
      amount: DEFAULT_RECIPE.butter * order.quantity,
      unit: 'g',
      costPerUnit: DEFAULT_INGREDIENT_COSTS.butter,
      total: DEFAULT_RECIPE.butter * order.quantity * DEFAULT_INGREDIENT_COSTS.butter,
    },
    {
      name: 'Granulated Sugar',
      amount: DEFAULT_RECIPE.sugar * order.quantity,
      unit: 'g',
      costPerUnit: DEFAULT_INGREDIENT_COSTS.sugar,
      total: DEFAULT_RECIPE.sugar * order.quantity * DEFAULT_INGREDIENT_COSTS.sugar,
    },
  ];

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
            <p className="font-semibold">₱{metrics.revenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Profit</p>
            <p className="font-semibold" style={{ color: roiColor }}>₱{metrics.profit.toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        className="p-4 rounded-lg border-2"
        style={{ 
          backgroundColor: `${roiColor}15`,
          borderColor: roiColor 
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">ROI Summary</h4>
          <span className="text-lg font-bold" style={{ color: roiColor }}>
            {metrics.roi.toFixed(1)}% ({roiLabel})
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Revenue</p>
            <p className="font-semibold">₱{metrics.revenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Costs</p>
            <p className="font-semibold">₱{(metrics.materialCost + metrics.laborCost).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Profit</p>
            <p className="font-semibold" style={{ color: roiColor }}>₱{metrics.profit.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Profit/Hour</p>
            <p className="font-semibold">₱{metrics.profitPerHour.toFixed(2)}</p>
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
                <TableHead className="text-right">Cost/g</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientBreakdown.map((ingredient) => (
                <TableRow key={ingredient.name}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell className="text-right">{ingredient.amount}{ingredient.unit}</TableCell>
                  <TableCell className="text-right">₱{ingredient.costPerUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₱{ingredient.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={3}>Total Materials</TableCell>
                <TableCell className="text-right">₱{metrics.materialCost.toFixed(2)}</TableCell>
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
                <TableCell className="font-medium">Labor ({order.quantity} batches)</TableCell>
                <TableCell className="text-right">{order.laborHours}h</TableCell>
                <TableCell className="text-right">₱{DEFAULT_LABOR_RATE.toFixed(2)}</TableCell>
                <TableCell className="text-right">₱{metrics.laborCost.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={3}>Total Labor</TableCell>
                <TableCell className="text-right">₱{metrics.laborCost.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Channel, Order, FlavorQuantity, FlavorType } from '@/types/pastry';
import { ROIBreakdown } from '@/components/ROIBreakdown';
import { Calculator } from 'lucide-react';
import { useFlavors, FLAVOR_LABELS } from '@/hooks/useFlavors';

interface OrderCalculatorProps {
  onAddOrder: (order: Omit<Order, 'id'>) => void;
}

export function OrderCalculator({ onAddOrder }: OrderCalculatorProps) {
  const { getFlavorPrices } = useFlavors();
  const flavorPrices = getFlavorPrices();
  
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('events');
  const [week, setWeek] = useState('');
  const [laborHours, setLaborHours] = useState(2);
  
  // Flavor quantities
  const [flavorQuantities, setFlavorQuantities] = useState<Record<FlavorType, number>>({
    'brown-butter-bites': 0,
    'milo': 0,
    'lolas-mix': 0,
    'cinnamon': 0,
  });

  // Get available flavors based on channel
  const getAvailableFlavors = (): FlavorType[] => {
    if (channel === 'wholesale') {
      return ['brown-butter-bites']; // Store orders only brown butter bites
    }
    return ['brown-butter-bites', 'milo', 'lolas-mix', 'cinnamon'];
  };

  // Calculate total quantity and average price
  const calculateTotals = () => {
    const availableFlavors = getAvailableFlavors();
    const totalQuantity = availableFlavors.reduce((sum, flavor) => sum + flavorQuantities[flavor], 0);
    
    const flavors: FlavorQuantity[] = availableFlavors
      .filter(flavor => flavorQuantities[flavor] > 0)
      .map(flavor => ({
        flavor,
        quantity: flavorQuantities[flavor],
        pricePerBatch: flavorPrices[flavor],
      }));
    
    const totalRevenue = flavors.reduce((sum, f) => sum + (f.quantity * f.pricePerBatch), 0);
    const avgPrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;
    
    return { totalQuantity, avgPrice, flavors };
  };

  const { totalQuantity, avgPrice, flavors } = calculateTotals();

  // Create preview order for ROI display
  const previewOrder: Order = {
    id: 'preview',
    name: name || 'New Order',
    quantity: totalQuantity,
    channel,
    week,
    pricePerBatch: avgPrice,
    laborHours,
    status: 'pending',
    flavors: flavors.length > 0 ? flavors : undefined,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !week || totalQuantity === 0) {
      return;
    }

    onAddOrder({
      name,
      quantity: totalQuantity,
      channel,
      week,
      pricePerBatch: avgPrice,
      laborHours,
      status: 'pending',
      flavors: flavors.length > 0 ? flavors : undefined,
    });

    // Reset form
    setName('');
    setChannel('events');
    setWeek('');
    setLaborHours(2);
    setFlavorQuantities({
      'brown-butter-bites': 0,
      'milo': 0,
      'lolas-mix': 0,
      'cinnamon': 0,
    });
  };

  const availableFlavors = getAvailableFlavors();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Order Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Order Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Wedding Order"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="week">Week</Label>
              <Input
                id="week"
                type="week"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select value={channel} onValueChange={(v) => {
                setChannel(v as Channel);
                // Reset flavors when changing to wholesale
                if (v === 'wholesale') {
                  setFlavorQuantities({
                    'brown-butter-bites': flavorQuantities['brown-butter-bites'],
                    'milo': 0,
                    'lolas-mix': 0,
                    'cinnamon': 0,
                  });
                }
              }}>
                <SelectTrigger id="channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wholesale">Wholesale (Store)</SelectItem>
                  <SelectItem value="events">Events (Market)</SelectItem>
                  <SelectItem value="online">Online Store</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor">Labor Hours</Label>
              <Input
                id="labor"
                type="number"
                min="0"
                step="0.5"
                value={laborHours}
                onChange={(e) => setLaborHours(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Flavor Quantities (batches of 10)</Label>
            <div className="grid grid-cols-2 gap-3">
              {availableFlavors.map((flavor) => (
                <div key={flavor} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{FLAVOR_LABELS[flavor]}</span>
                    <span className="text-muted-foreground">${flavorPrices[flavor]}/batch</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={flavorQuantities[flavor]}
                    onChange={(e) => 
                      setFlavorQuantities(prev => ({
                        ...prev,
                        [flavor]: parseInt(e.target.value) || 0
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            {channel === 'wholesale' && (
              <p className="text-sm text-muted-foreground">
                Store orders only accept Brown Butter Bites
              </p>
            )}
          </div>

          {totalQuantity > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Total: {totalQuantity} batches • Avg Price: ${avgPrice.toFixed(2)}/batch
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Production Preview</h3>
            <ROIBreakdown order={previewOrder} />
          </div>

          <Button type="submit" className="w-full" disabled={!name || !week || totalQuantity === 0}>
            Add Order
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

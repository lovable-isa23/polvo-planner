import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Channel, Order, FlavorQuantity, FlavorType } from '@/types/pastry';
import { ROIBreakdown } from '@/components/ROIBreakdown';
import { Calendar as CalendarIcon, Calculator } from 'lucide-react';
import { useFlavors, FLAVOR_LABELS } from '@/hooks/useFlavors';
import { calculateLaborHours } from '@/lib/calculations';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, getISOWeek, getYear } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderCalculatorProps {
  onAddOrder: (order: Omit<Order, 'id'>) => void;
}

export function OrderCalculator({ onAddOrder }: OrderCalculatorProps) {
  const { getFlavorPrices } = useFlavors();
  const flavorPrices = getFlavorPrices();
  
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('events');
  const [dueDate, setDueDate] = useState<Date>();
  const [laborHours, setLaborHours] = useState(0);
  const [miscCosts, setMiscCosts] = useState(0);
  
  // Flavor quantities
  const [flavorQuantities, setFlavorQuantities] = useState<Record<FlavorType, number>>({
    'brown-butter-bites': 0,
    'milo': 0,
    'lolas-mix': 0,
    'cinnamon': 0,
  });

  // Get available flavors based on channel
  const getAvailableFlavors = (): FlavorType[] => {
    if (channel === 'online') {
      return ['brown-butter-bites']; // Online store only brown butter bites
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

  // Auto-calculate labor hours based on total polvorons
  useEffect(() => {
    if (totalQuantity > 0) {
      const totalPolvorons = totalQuantity * 10; // Each batch is 10 polvorons
      const calculatedHours = calculateLaborHours(totalPolvorons);
      setLaborHours(calculatedHours);
    } else {
      setLaborHours(0);
    }
  }, [totalQuantity]);

  // Calculate week from due date
  const week = dueDate ? `${getYear(dueDate)}-W${getISOWeek(dueDate).toString().padStart(2, '0')}` : '';

  // Create preview order for ROI display
  const previewOrder: Order = {
    id: 'preview',
    name: name || 'New Order',
    quantity: totalQuantity,
    channel,
    week,
    dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : '',
    pricePerBatch: avgPrice,
    laborHours,
    status: 'pending',
    flavors: flavors.length > 0 ? flavors : undefined,
    miscCosts: channel === 'events' ? miscCosts : 0,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !dueDate || totalQuantity === 0) {
      return;
    }

    onAddOrder({
      name,
      quantity: totalQuantity,
      channel,
      week,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      pricePerBatch: avgPrice,
      laborHours,
      status: 'pending',
      flavors: flavors.length > 0 ? flavors : undefined,
      miscCosts: channel === 'events' ? miscCosts : 0,
    });

    // Reset form
    setName('');
    setChannel('events');
    setDueDate(undefined);
    setLaborHours(0);
    setMiscCosts(0);
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
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select value={channel} onValueChange={(v) => {
                setChannel(v as Channel);
                // Reset flavors when changing to online
                if (v === 'online') {
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
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="online">Online Store</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor">Labor Hours (auto-calculated)</Label>
              <Input
                id="labor"
                type="number"
                min="0"
                step="0.5"
                value={laborHours}
                onChange={(e) => setLaborHours(Number(e.target.value))}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Based on 80 polvorons/hour production rate
              </p>
            </div>

            {channel === 'events' && (
              <div className="space-y-2">
                <Label htmlFor="misc">Misc. Costs (Vendor Fees, Permits, etc.) ($)</Label>
                <Input
                  id="misc"
                  type="number"
                  min="0"
                  step="0.01"
                  value={miscCosts}
                  onChange={(e) => setMiscCosts(Number(e.target.value))}
                />
              </div>
            )}
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
            {channel === 'online' && (
              <p className="text-sm text-muted-foreground">
                Online store only accepts Brown Butter Bites
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

          <Button type="submit" className="w-full" disabled={!name || !dueDate || totalQuantity === 0}>
            Add Order
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

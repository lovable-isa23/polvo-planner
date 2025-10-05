import { useState } from 'react';
import { Order, Channel, FlavorQuantity, FlavorType } from '@/types/pastry';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO, getISOWeek, getYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFlavors, FLAVOR_LABELS } from '@/hooks/useFlavors';

interface OrderEditorProps {
  order: Order;
  onSave: (order: Order) => void;
  onCancel: () => void;
}

export function OrderEditor({ order, onSave, onCancel }: OrderEditorProps) {
  const { getFlavorPrices } = useFlavors();
  const flavorPrices = getFlavorPrices();

  const [name, setName] = useState(order.name);
  const [channel, setChannel] = useState<Channel>(order.channel);
  const [dueDate, setDueDate] = useState<Date>(parseISO(order.dueDate));
  const [laborHours, setLaborHours] = useState(order.laborHours);
  const [miscCosts, setMiscCosts] = useState(order.miscCosts || 0);

  // Initialize flavor quantities
  const initialFlavors: Record<FlavorType, number> = {
    'brown-butter-bites': 0,
    'milo': 0,
    'lolas-mix': 0,
    'cinnamon': 0,
  };

  order.flavors?.forEach(f => {
    initialFlavors[f.flavor] = f.quantity;
  });

  const [flavorQuantities, setFlavorQuantities] = useState(initialFlavors);

  const getAvailableFlavors = (): FlavorType[] => {
    if (channel === 'online') {
      return ['brown-butter-bites'];
    }
    return ['brown-butter-bites', 'milo', 'lolas-mix', 'cinnamon'];
  };

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

  const handleSave = () => {
    const week = `${getYear(dueDate)}-W${getISOWeek(dueDate).toString().padStart(2, '0')}`;
    
    onSave({
      ...order,
      name,
      quantity: totalQuantity,
      channel,
      week,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      pricePerBatch: avgPrice,
      laborHours,
      flavors: flavors.length > 0 ? flavors : undefined,
      miscCosts: channel === 'events' ? miscCosts : 0,
    });
  };

  const availableFlavors = getAvailableFlavors();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Order Name</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Wedding Order"
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
                onSelect={(date) => date && setDueDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-channel">Channel</Label>
          <Select value={channel} onValueChange={(v) => {
            setChannel(v as Channel);
            if (v === 'online') {
              setFlavorQuantities({
                'brown-butter-bites': flavorQuantities['brown-butter-bites'],
                'milo': 0,
                'lolas-mix': 0,
                'cinnamon': 0,
              });
            }
          }}>
            <SelectTrigger id="edit-channel">
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
          <Label htmlFor="edit-labor">Labor Hours</Label>
          <Input
            id="edit-labor"
            type="number"
            min="0"
            step="0.5"
            value={laborHours}
            onChange={(e) => setLaborHours(Number(e.target.value))}
          />
        </div>

        {channel === 'events' && (
          <div className="space-y-2">
            <Label htmlFor="edit-misc">Misc. Costs (Vendor Fees, Permits, etc.) ($)</Label>
            <Input
              id="edit-misc"
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
      </div>

      {totalQuantity > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">
            Total: {totalQuantity} batches • Avg Price: ${avgPrice.toFixed(2)}/batch
          </p>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name || !dueDate || totalQuantity === 0}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

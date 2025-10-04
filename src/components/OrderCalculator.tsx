import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Channel, Order } from '@/types/pastry';
import { calculateROI, getROIColor } from '@/lib/calculations';
import { Calculator } from 'lucide-react';

interface OrderCalculatorProps {
  onAddOrder: (order: Order) => void;
}

export function OrderCalculator({ onAddOrder }: OrderCalculatorProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [channel, setChannel] = useState<Channel>('online');
  const [pricePerBatch, setPricePerBatch] = useState(500);
  const [laborHours, setLaborHours] = useState(2);
  const [week, setWeek] = useState('');

  const previewOrder: Order = {
    id: 'preview',
    name: name || 'New Order',
    quantity,
    channel,
    week,
    pricePerBatch,
    laborHours,
    status: 'pending',
  };

  const metrics = calculateROI(previewOrder);
  const roiColor = getROIColor(metrics.roi);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !week) return;
    
    onAddOrder({
      ...previewOrder,
      id: Date.now().toString(),
      name,
    });

    // Reset form
    setName('');
    setQuantity(1);
    setPricePerBatch(500);
    setLaborHours(2);
  };

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
              <Label htmlFor="quantity">Batches (10 pastries each)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
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
              <Label htmlFor="price">Price per Batch (₱)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="10"
                value={pricePerBatch}
                onChange={(e) => setPricePerBatch(Number(e.target.value))}
              />
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

          <div 
            className="p-4 rounded-lg border-2 transition-colors"
            style={{ 
              backgroundColor: `${roiColor}15`,
              borderColor: roiColor 
            }}
          >
            <h3 className="font-semibold mb-3">ROI Preview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Revenue</p>
                <p className="font-semibold">₱{metrics.revenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Materials</p>
                <p className="font-semibold">₱{metrics.materialCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Labor</p>
                <p className="font-semibold">₱{metrics.laborCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Profit</p>
                <p className="font-semibold" style={{ color: roiColor }}>
                  ₱{metrics.profit.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">ROI</p>
                <p className="font-semibold" style={{ color: roiColor }}>
                  {metrics.roi.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Profit/Hour</p>
                <p className="font-semibold">₱{metrics.profitPerHour.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Add Order
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

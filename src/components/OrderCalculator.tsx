import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Channel, Order } from '@/types/pastry';
import { ROIBreakdown } from '@/components/ROIBreakdown';
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

          <div className="space-y-2">
            <h3 className="font-semibold">Order Preview</h3>
            <ROIBreakdown order={previewOrder} />
          </div>

          <Button type="submit" className="w-full">
            Add Order
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

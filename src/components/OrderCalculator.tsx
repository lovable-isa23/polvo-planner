import { useState } from 'react';
import { format, getISOWeek } from 'date-fns';
import { Calendar as CalendarIcon, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Channel, Order } from '@/types/pastry';
import { ROIBreakdown } from '@/components/ROIBreakdown';

interface OrderCalculatorProps {
  onAddOrder: (order: Order) => void;
}

export function OrderCalculator({ onAddOrder }: OrderCalculatorProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [channel, setChannel] = useState<Channel>('online');
  const [pricePerBatch, setPricePerBatch] = useState(10);
  const [laborHours, setLaborHours] = useState(2);
  const [dueDate, setDueDate] = useState<Date>();

  const week = dueDate ? `${format(dueDate, 'yyyy')}-W${getISOWeek(dueDate)}` : '';

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
    if (!name || !dueDate) return;
    
    onAddOrder({
      ...previewOrder,
      id: Date.now().toString(),
      name,
      week,
    });

    // Reset form
    setName('');
    setQuantity(1);
    setPricePerBatch(10);
    setLaborHours(2);
    setDueDate(undefined);
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
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Orders (10 pastries each)</Label>
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
              <Label htmlFor="price">Price per Order ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
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
            <h3 className="font-semibold">Production Preview</h3>
            <ROIBreakdown order={previewOrder} editable />
          </div>

          <Button type="submit" className="w-full">
            Add Order
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
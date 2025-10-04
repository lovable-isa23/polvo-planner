import { useState } from 'react';
import { Order } from '@/types/pastry';
import { OrderCalculator } from '@/components/OrderCalculator';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { ChannelAllocator } from '@/components/ChannelAllocator';
import { DecisionHelper } from '@/components/DecisionHelper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const handleAddOrder = (order: Order) => {
    setOrders((prev) => [...prev, order]);
  };

  const handleSelectOrder = (order: Order) => {
    console.log('Selected order:', order);
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Polvo Planner</h1>
          <p className="text-muted-foreground">
            Plan production, calculate ROI, and optimize your pastry business
          </p>
        </header>

        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <OrderCalculator onAddOrder={handleAddOrder} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <WeeklyCalendar orders={orders} onSelectOrder={handleSelectOrder} />
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <ChannelAllocator orders={orders} />
          </TabsContent>

          <TabsContent value="decisions" className="space-y-6">
            <DecisionHelper pendingOrders={pendingOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

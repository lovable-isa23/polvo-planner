import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '@/types/pastry';
import { calculateROI } from '@/lib/calculations';
import { Store, Users, ShoppingBag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ChannelAllocatorProps {
  orders: Order[];
}

const CHANNEL_ICONS = {
  wholesale: Store,
  events: Users,
  online: ShoppingBag,
};

const CHANNEL_LABELS = {
  wholesale: 'Wholesale',
  events: 'Events',
  online: 'Online Store',
};

export function ChannelAllocator({ orders }: ChannelAllocatorProps) {
  const channelStats = orders.reduce(
    (acc, order) => {
      const metrics = calculateROI(order);
      if (!acc[order.channel]) {
        acc[order.channel] = {
          orders: 0,
          totalQuantity: 0,
          revenue: 0,
          profit: 0,
        };
      }
      acc[order.channel].orders++;
      acc[order.channel].totalQuantity += order.quantity;
      acc[order.channel].revenue += metrics.revenue;
      acc[order.channel].profit += metrics.profit;
      return acc;
    },
    {} as Record<string, { orders: number; totalQuantity: number; revenue: number; profit: number }>
  );

  const totalRevenue = Object.values(channelStats).reduce((sum, s) => sum + s.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {(['wholesale', 'events', 'online'] as const).map((channel) => {
            const stats = channelStats[channel] || { orders: 0, totalQuantity: 0, revenue: 0, profit: 0 };
            const percentage = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;
            const Icon = CHANNEL_ICONS[channel];

            return (
              <div key={channel} className="space-y-2 p-4 rounded-xl border-2 bg-gradient-to-br from-background to-muted/10 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-bold text-base">{CHANNEL_LABELS[channel]}</span>
                  </div>
                  <span className="text-base font-bold text-primary">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={percentage} className="h-3 rounded-full" />
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium">Orders</p>
                    <p className="font-bold text-base">{stats.orders}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Total Qty</p>
                    <p className="font-bold text-base">{stats.totalQuantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Revenue</p>
                    <p className="font-bold text-base">${stats.revenue.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Profit</p>
                    <p className="font-bold text-base">${stats.profit.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

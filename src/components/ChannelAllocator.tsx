import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order, Channel } from '@/types/pastry';
import { calculateROI, getROIColor, getROILabel } from '@/lib/calculations';
import { Store, Users, ShoppingBag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatSmart } from '@/lib/formatters';

interface ChannelAllocatorProps {
  orders: Order[];
  onChannelClick?: (channel: Channel) => void;
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

export function ChannelAllocator({ orders, onChannelClick }: ChannelAllocatorProps) {
  const channelStats = orders.reduce(
    (acc, order) => {
      const metrics = calculateROI(order);
      if (!acc[order.channel]) {
        acc[order.channel] = {
          orders: 0,
          totalQuantity: 0,
          revenue: 0,
          profit: 0,
          totalROI: 0,
        };
      }
      acc[order.channel].orders++;
      acc[order.channel].totalQuantity += order.quantity;
      acc[order.channel].revenue += metrics.revenue;
      acc[order.channel].profit += metrics.profit;
      acc[order.channel].totalROI += metrics.roi;
      return acc;
    },
    {} as Record<string, { orders: number; totalQuantity: number; revenue: number; profit: number; totalROI: number }>
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
            const stats = channelStats[channel] || { orders: 0, totalQuantity: 0, revenue: 0, profit: 0, totalROI: 0 };
            const percentage = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;
            const avgROI = stats.orders > 0 ? stats.totalROI / stats.orders : 0;
            const roiColor = getROIColor(avgROI);
            const roiLabel = getROILabel(avgROI);
            const Icon = CHANNEL_ICONS[channel];

            return (
              <div 
                key={channel} 
                className="space-y-2 p-4 rounded-xl border-2 bg-gradient-to-br from-background to-muted/10 shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() => onChannelClick?.(channel)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-bold text-base">{CHANNEL_LABELS[channel]}</span>
                  </div>
                  <span className="text-base font-bold text-primary">
                    {formatSmart(percentage)}%
                  </span>
                </div>
                <Progress value={percentage} className="h-3 rounded-full" />
                <div className="grid grid-cols-5 gap-2 text-sm">
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
                    <p className="font-bold text-base">${formatSmart(stats.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Profit</p>
                    <p className="font-bold text-base">${formatSmart(stats.profit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Avg ROI</p>
                    <p className="font-bold text-base" style={{ color: roiColor }}>
                      {roiLabel}
                    </p>
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

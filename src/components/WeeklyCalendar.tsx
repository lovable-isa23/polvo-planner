import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '@/types/pastry';
import { calculateROI, getROIColor, getROILabel } from '@/lib/calculations';
import { Calendar, TrendingUp, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ROIBreakdown } from '@/components/ROIBreakdown';
import { useState } from 'react';
import { format, setISOWeek, startOfYear, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { OrderEditor } from '@/components/OrderEditor';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { FLAVOR_LABELS } from '@/hooks/useFlavors';

interface WeeklyCalendarProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
}

const SEASONAL_PEAKS = {
  '12': { name: 'Christmas Season', multiplier: 2.5 },
  '06': { name: 'Wedding Season', multiplier: 1.8 },
  '02': { name: 'Valentine\'s Day', multiplier: 1.5 },
};

export function WeeklyCalendar({ orders, onSelectOrder, onUpdateOrder }: WeeklyCalendarProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Sort orders by due date first, then by quantity descending
  const sortedOrders = [...orders].sort((a, b) => {
    const dateCompare = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (dateCompare !== 0) return dateCompare;
    return b.quantity - a.quantity;
  });

  const groupedByWeek = sortedOrders.reduce((acc, order) => {
    if (!acc[order.week]) acc[order.week] = [];
    acc[order.week].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const weeks = Object.keys(groupedByWeek).sort();

  const getSeasonalInfo = (weekStr: string) => {
    const month = weekStr.split('-W')[0].split('-')[1];
    return SEASONAL_PEAKS[month as keyof typeof SEASONAL_PEAKS];
  };

  const formatWeekHeader = (weekStr: string) => {
    // Parse ISO week format (e.g., "2025-W40")
    const [year, weekNum] = weekStr.split('-W');
    // Calculate the actual date for this ISO week
    const date = setISOWeek(startOfYear(new Date(parseInt(year), 0, 1)), parseInt(weekNum));
    const month = format(date, 'MMMM');
    return `Week ${weekNum} - ${month} ${year}`;
  };

  const getOrderPriority = (order: Order) => {
    const metrics = calculateROI(order);
    // Priority based on profit per hour (higher is better)
    return metrics.profitPerHour;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Production Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {weeks.map((week) => {
            const weekOrders = groupedByWeek[week].sort((a, b) => getOrderPriority(b) - getOrderPriority(a));
            const totalOrders = weekOrders.reduce((sum, o) => sum + o.quantity, 0);
            const totalRevenue = weekOrders.reduce((sum, o) => sum + calculateROI(o).revenue, 0);
            const seasonalInfo = getSeasonalInfo(week);

            return (
              <div key={week} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <h3 className="font-bold text-lg">{formatWeekHeader(week)}</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {totalOrders} orders • ${totalRevenue % 1 === 0 ? totalRevenue : totalRevenue.toFixed(2)} revenue
                    </p>
                  </div>
                  {seasonalInfo && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {seasonalInfo.name}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2">
                  {weekOrders.map((order, index) => {
                    const metrics = calculateROI(order);
                    const roiColor = getROIColor(metrics.roi);
                    
                    const formatNumber = (num: number) => {
                      return num % 1 === 0 ? num.toString() : num.toFixed(2);
                    };

                    return (
                      <HoverCard key={order.id}>
                        <HoverCardTrigger asChild>
                          <div
                            onClick={() => {
                              setSelectedOrder(order);
                              onSelectOrder(order);
                            }}
                            className="flex-shrink-0 w-64 p-4 rounded-xl border-2 cursor-pointer hover:shadow-xl hover:scale-105 transition-all relative overflow-hidden"
                            style={{
                              backgroundColor: `${roiColor}10`,
                              borderColor: roiColor,
                            }}
                          >
                            {/* ROI Gradient Background */}
                            <div 
                              className="absolute inset-0 opacity-30"
                              style={{
                                background: `linear-gradient(135deg, 
                                  hsl(0, 100%, 50%) 0%, 
                                  hsl(30, 100%, 50%) 25%, 
                                  hsl(60, 100%, 50%) 50%, 
                                  hsl(90, 100%, 50%) 75%, 
                                  hsl(120, 100%, 50%) 100%)`,
                                maskImage: `linear-gradient(to right, transparent 0%, black ${metrics.roi < 0 ? 0 : Math.min((metrics.roi / 100) * 100, 100)}%, transparent ${metrics.roi < 0 ? 0 : Math.min((metrics.roi / 100) * 100, 100)}%)`,
                                WebkitMaskImage: `linear-gradient(to right, transparent 0%, black ${metrics.roi < 0 ? 0 : Math.min((metrics.roi / 100) * 100, 100)}%, transparent ${metrics.roi < 0 ? 0 : Math.min((metrics.roi / 100) * 100, 100)}%)`
                              }}
                            />
                            
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background border-2 flex items-center justify-center text-xs font-bold z-10" style={{ borderColor: roiColor, color: roiColor }}>
                              {index + 1}
                            </div>
                            <div className="space-y-2 relative z-10">
                              <div>
                                <p className="font-bold text-base pr-8">{order.name}</p>
                                <p className="text-xs text-muted-foreground font-medium">
                                  {order.quantity} orders • {order.channel}
                                </p>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <div>
                                  <p className="text-xs text-muted-foreground">ROI</p>
                                  <p className="font-bold text-sm" style={{ color: roiColor }}>
                                    {getROILabel(metrics.roi)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Profit</p>
                                  <p className="text-sm font-semibold">${formatNumber(metrics.profit)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">$/hr</p>
                                  <p className="text-sm font-semibold">${formatNumber(metrics.profitPerHour)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Flavor Breakdown</h4>
                            {order.flavors && order.flavors.length > 0 ? (
                              <div className="space-y-1">
                                {order.flavors.map((flavor) => (
                                  <div key={flavor.flavor} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{FLAVOR_LABELS[flavor.flavor]}</span>
                                    <span className="font-medium">{flavor.quantity} batches</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No flavor breakdown available</p>
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {weeks.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No orders scheduled yet. Add orders from the Calculator tab.
            </p>
          )}
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={() => {
          setSelectedOrder(null);
          setIsEditing(false);
        }}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedOrder?.name} - Detailed Breakdown</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            {selectedOrder && (
              <>
                {!isEditing && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Order Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Total Batches:</span> <span className="font-medium">{selectedOrder.quantity}</span></p>
                      {selectedOrder.flavors && selectedOrder.flavors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-muted-foreground mb-1">Flavor Breakdown:</p>
                          <ul className="ml-4 space-y-1">
                            {selectedOrder.flavors.map((flavor) => (
                              <li key={flavor.flavor}>
                                <span className="font-medium">{FLAVOR_LABELS[flavor.flavor]}:</span> {flavor.quantity} batches ({flavor.quantity * 10} pastries)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {isEditing ? (
                  <OrderEditor 
                    order={selectedOrder} 
                    onSave={(updatedOrder) => {
                      onUpdateOrder(updatedOrder);
                      setIsEditing(false);
                      setSelectedOrder(null);
                    }}
                    onCancel={() => setIsEditing(false)}
                  />
                ) : (
                  <ROIBreakdown order={selectedOrder} />
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

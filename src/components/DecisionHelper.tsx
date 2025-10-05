import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '@/types/pastry';
import { calculateROI, getROIColor, getROILabel } from '@/lib/calculations';
import { AlertCircle, CheckCircle2, TrendingDown, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatSmart } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';

interface DecisionHelperProps {
  pendingOrders: Order[];
  onApprove: (order: Order) => void;
  onReject: (order: Order) => void;
}

export function DecisionHelper({ pendingOrders, onApprove, onReject }: DecisionHelperProps) {
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const ordersWithMetrics = pendingOrders.map((order) => ({
    order,
    metrics: calculateROI(order),
  })).sort((a, b) => b.metrics.profitPerHour - a.metrics.profitPerHour);

  const handleTouchStart = (e: React.TouchEvent, orderId: string) => {
    setSwipingId(orderId);
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingId) return;
    currentXRef.current = e.touches[0].clientX;
    const offset = currentXRef.current - startXRef.current;
    setSwipeOffset(offset);
  };

  const handleTouchEnd = (order: Order) => {
    if (!swipingId) return;
    
    const swipeThreshold = 100;
    if (swipeOffset > swipeThreshold) {
      onApprove(order);
    } else if (swipeOffset < -swipeThreshold) {
      onReject(order);
    }
    
    setSwipingId(null);
    setSwipeOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent, orderId: string) => {
    setSwipingId(orderId);
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!swipingId) return;
    currentXRef.current = e.clientX;
    const offset = currentXRef.current - startXRef.current;
    setSwipeOffset(offset);
  };

  const handleMouseUp = (order: Order) => {
    if (!swipingId) return;
    
    const swipeThreshold = 100;
    if (swipeOffset > swipeThreshold) {
      onApprove(order);
    } else if (swipeOffset < -swipeThreshold) {
      onReject(order);
    }
    
    setSwipingId(null);
    setSwipeOffset(0);
  };

  const recommendations = ordersWithMetrics.map(({ order, metrics }) => {
    const roiColor = getROIColor(metrics.roi);
    let recommendation = '';
    let icon = CheckCircle2;

    if (metrics.roi < 0) {
      recommendation = 'Reject - This order will result in a loss';
      icon = TrendingDown;
    } else if (metrics.roi < 20) {
      recommendation = 'Reconsider - Low ROI, try to negotiate better terms';
      icon = AlertCircle;
    } else if (metrics.roi < 40) {
      recommendation = 'Accept with caution - Moderate returns';
      icon = AlertCircle;
    } else {
      recommendation = 'Strongly recommend - Excellent returns';
      icon = CheckCircle2;
    }

    return {
      order,
      metrics,
      recommendation,
      icon,
      roiColor,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision Assistant</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Swipe right or click <ThumbsUp className="inline h-3 w-3" /> to approve • Swipe left or click <ThumbsDown className="inline h-3 w-3" /> to reject
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No pending orders to evaluate
          </p>
        ) : (
          recommendations.map(({ order, metrics, recommendation, icon: Icon, roiColor }) => {
            const isActive = swipingId === order.id;
            const offset = isActive ? swipeOffset : 0;
            const approveOpacity = Math.max(0, Math.min(1, offset / 100));
            const rejectOpacity = Math.max(0, Math.min(1, -offset / 100));
            
            return (
              <div key={order.id} className="relative">
                {/* Swipe feedback backgrounds */}
                <div 
                  className="absolute inset-0 rounded-lg flex items-center justify-start pl-8 pointer-events-none z-0"
                  style={{
                    backgroundColor: `hsl(var(--roi-excellent))`,
                    opacity: approveOpacity * 0.3,
                  }}
                >
                  <ThumbsUp className="h-8 w-8" style={{ color: 'hsl(var(--roi-excellent))' }} />
                </div>
                <div 
                  className="absolute inset-0 rounded-lg flex items-center justify-end pr-8 pointer-events-none z-0"
                  style={{
                    backgroundColor: `hsl(var(--roi-critical))`,
                    opacity: rejectOpacity * 0.3,
                  }}
                >
                  <ThumbsDown className="h-8 w-8" style={{ color: 'hsl(var(--roi-critical))' }} />
                </div>
                
                <Alert 
                  className="border-2 relative overflow-hidden cursor-grab active:cursor-grabbing transition-transform select-none" 
                  style={{ 
                    borderColor: roiColor,
                    transform: `translateX(${offset}px)`,
                  }}
                  onTouchStart={(e) => handleTouchStart(e, order.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(order)}
                  onMouseDown={(e) => handleMouseDown(e, order.id)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={() => handleMouseUp(order)}
                  onMouseLeave={() => {
                    if (swipingId === order.id) {
                      handleMouseUp(order);
                    }
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                      background: `linear-gradient(135deg, ${roiColor}, transparent)`
                    }}
                  />
                  <Icon className="h-4 w-4 relative z-10" style={{ color: roiColor }} />
                  <AlertDescription className="relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{order.name}</p>
                        <span 
                          className="text-sm font-semibold"
                          style={{ color: roiColor }}
                        >
                          {getROILabel(metrics.roi)} ({formatSmart(metrics.roi)}%)
                        </span>
                      </div>
                      <p className="text-sm">{recommendation}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs pt-2">
                        <div>
                          <p className="text-muted-foreground">Profit</p>
                          <p className="font-medium">${formatSmart(metrics.profit)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Profit/Hour</p>
                          <p className="font-medium">${formatSmart(metrics.profitPerHour)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Channel</p>
                          <p className="font-medium capitalize">{order.channel}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => onApprove(order)}
                          size="sm"
                          className="flex-1 bg-[hsl(var(--roi-excellent))] hover:bg-[hsl(var(--roi-excellent))]/90 text-white"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => onReject(order)}
                          size="sm"
                          variant="outline"
                          className="flex-1 border-[hsl(var(--roi-critical))] text-[hsl(var(--roi-critical))] hover:bg-[hsl(var(--roi-critical))]/10"
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

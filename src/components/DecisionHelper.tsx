import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '@/types/pastry';
import { calculateROI, getROIColor, getROILabel } from '@/lib/calculations';
import { AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatSmart } from '@/lib/formatters';

interface DecisionHelperProps {
  pendingOrders: Order[];
}

export function DecisionHelper({ pendingOrders }: DecisionHelperProps) {
  const ordersWithMetrics = pendingOrders.map((order) => ({
    order,
    metrics: calculateROI(order),
  })).sort((a, b) => b.metrics.profitPerHour - a.metrics.profitPerHour);

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
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No pending orders to evaluate
          </p>
        ) : (
          recommendations.map(({ order, metrics, recommendation, icon: Icon, roiColor }) => (
            <Alert 
              key={order.id} 
              className="border-2 relative overflow-hidden" 
              style={{ borderColor: roiColor }}
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
                </div>
              </AlertDescription>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  );
}

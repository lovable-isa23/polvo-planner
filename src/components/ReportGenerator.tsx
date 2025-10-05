import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Order } from '@/types/pastry';
import { calculateROI } from '@/lib/calculations';
import { formatSmart } from '@/lib/formatters';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface ReportGeneratorProps {
  orders: Order[];
}

export const ReportGenerator = ({ orders }: ReportGeneratorProps) => {
  const generateReport = () => {
    if (orders.length === 0) {
      toast.error('No orders to generate report');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.text('Pastry Production Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Report Date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Summary Statistics
      const metrics = calculateSummaryMetrics(orders);
      
      doc.setFontSize(14);
      doc.text('Summary Statistics', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const summaryLines = [
        `Total Orders: ${metrics.totalOrders}`,
        `Total Revenue: $${formatSmart(metrics.totalRevenue)}`,
        `Total Profit: $${formatSmart(metrics.totalProfit)}`,
        `Average ROI: ${formatSmart(metrics.avgROI)}%`,
        `Total Labor Hours: ${formatSmart(metrics.totalLaborHours)}`,
        `Average Profit/Hour: $${formatSmart(metrics.avgProfitPerHour)}`,
      ];

      summaryLines.forEach(line => {
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;

      // Channel Breakdown
      doc.setFontSize(14);
      doc.text('Channel Performance', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      Object.entries(metrics.channelBreakdown).forEach(([channel, data]) => {
        doc.text(`${channel.toUpperCase()}:`, 20, yPosition);
        yPosition += 6;
        doc.text(`  Orders: ${data.count} | Revenue: $${formatSmart(data.revenue)} | Avg ROI: ${formatSmart(data.avgROI)}%`, 20, yPosition);
        yPosition += 8;
      });
      yPosition += 10;

      // Key Insights
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Key Insights', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const insights = generateInsights(orders, metrics);
      insights.forEach(insight => {
        const lines = doc.splitTextToSize(insight, pageWidth - 40);
        lines.forEach((line: string) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 4;
      });

      // Top Performing Orders
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      yPosition += 10;
      doc.setFontSize(14);
      doc.text('Top 5 Performing Orders (by Profit/Hour)', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      const topOrders = [...orders]
        .map(order => ({ ...order, metrics: calculateROI(order) }))
        .sort((a, b) => b.metrics.profitPerHour - a.metrics.profitPerHour)
        .slice(0, 5);

      topOrders.forEach((order, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${index + 1}. ${order.name} - ${order.channel}`, 20, yPosition);
        yPosition += 5;
        doc.text(`   Profit/Hr: $${formatSmart(order.metrics.profitPerHour)} | ROI: ${formatSmart(order.metrics.roi)}%`, 20, yPosition);
        yPosition += 8;
      });

      // Save the PDF
      doc.save(`pastry-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  return (
    <Button onClick={generateReport} variant="outline" className="gap-2">
      <FileText className="h-4 w-4" />
      Generate PDF Report
    </Button>
  );
};

interface SummaryMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  avgROI: number;
  totalLaborHours: number;
  avgProfitPerHour: number;
  channelBreakdown: {
    [key: string]: {
      count: number;
      revenue: number;
      profit: number;
      avgROI: number;
    };
  };
}

function calculateSummaryMetrics(orders: Order[]): SummaryMetrics {
  const channelBreakdown: SummaryMetrics['channelBreakdown'] = {};

  let totalRevenue = 0;
  let totalProfit = 0;
  let totalROI = 0;
  let totalLaborHours = 0;
  let totalProfitPerHour = 0;

  orders.forEach(order => {
    const metrics = calculateROI(order);
    
    totalRevenue += metrics.revenue;
    totalProfit += metrics.profit;
    totalROI += metrics.roi;
    totalLaborHours += order.laborHours;
    totalProfitPerHour += metrics.profitPerHour;

    if (!channelBreakdown[order.channel]) {
      channelBreakdown[order.channel] = {
        count: 0,
        revenue: 0,
        profit: 0,
        avgROI: 0,
      };
    }

    channelBreakdown[order.channel].count++;
    channelBreakdown[order.channel].revenue += metrics.revenue;
    channelBreakdown[order.channel].profit += metrics.profit;
    channelBreakdown[order.channel].avgROI += metrics.roi;
  });

  // Calculate averages for channels
  Object.keys(channelBreakdown).forEach(channel => {
    channelBreakdown[channel].avgROI /= channelBreakdown[channel].count;
  });

  return {
    totalOrders: orders.length,
    totalRevenue,
    totalProfit,
    avgROI: totalROI / orders.length,
    totalLaborHours,
    avgProfitPerHour: totalProfitPerHour / orders.length,
    channelBreakdown,
  };
}

function generateInsights(orders: Order[], metrics: SummaryMetrics): string[] {
  const insights: string[] = [];

  // Best performing channel
  const bestChannel = Object.entries(metrics.channelBreakdown)
    .sort((a, b) => b[1].avgROI - a[1].avgROI)[0];
  
  if (bestChannel) {
    insights.push(`• ${bestChannel[0].toUpperCase()} is your best performing channel with an average ROI of ${formatSmart(bestChannel[1].avgROI)}%.`);
  }

  // Most profitable channel
  const mostProfitable = Object.entries(metrics.channelBreakdown)
    .sort((a, b) => b[1].profit - a[1].profit)[0];
  
  if (mostProfitable) {
    insights.push(`• ${mostProfitable[0].toUpperCase()} generates the highest total profit at $${formatSmart(mostProfitable[1].profit)}.`);
  }

  // ROI analysis
  if (metrics.avgROI > 100) {
    insights.push(`• Excellent overall performance with an average ROI of ${formatSmart(metrics.avgROI)}% across all orders.`);
  } else if (metrics.avgROI > 50) {
    insights.push(`• Good performance with an average ROI of ${formatSmart(metrics.avgROI)}%. Consider optimizing lower-performing orders.`);
  } else {
    insights.push(`• Average ROI of ${formatSmart(metrics.avgROI)}% indicates room for improvement. Review costs and pricing strategies.`);
  }

  // Labor efficiency
  const avgEfficiency = metrics.totalProfit / metrics.totalLaborHours;
  insights.push(`• Labor efficiency is $${formatSmart(avgEfficiency)} profit per hour worked.`);

  // Order status breakdown
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pendingCount = statusCounts['pending'] || 0;
  if (pendingCount > 0) {
    insights.push(`• ${pendingCount} order${pendingCount > 1 ? 's' : ''} pending review. Consider approving profitable orders to maximize revenue.`);
  }

  return insights;
}

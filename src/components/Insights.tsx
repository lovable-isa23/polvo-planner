
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateWeeklyProfits, calculateAverageROI } from "@/lib/calculations";

const chartConfig = {
  profit: {
    label: "Profit",
    color: "#8884d8",
  },
} satisfies ChartConfig;

export const Insights = ({ orders }) => {
  const weeklyProfits = calculateWeeklyProfits(orders);
  const averageROI = calculateAverageROI(orders);

  const chartData = Object.entries(weeklyProfits)
    .sort(([weekA], [weekB]) => {
      const [yearA, weekNumA] = weekA.split('-W');
      const [yearB, weekNumB] = weekB.split('-W');
      if (yearA !== yearB) {
        return yearA.localeCompare(yearB);
      }
      return parseInt(weekNumA, 10) - parseInt(weekNumB, 10);
    })
    .map(([week, profit]) => {
      const [year, weekNumber] = week.split('-W');
      return {
        name: `Week ${year} - W${weekNumber}`,
        profit,
      };
    });

  const totalProfit = Object.values(weeklyProfits).reduce((acc, profit) => acc + profit, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Profits</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height={'100%'}>
              <BarChart layout="vertical" data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickCount={15} />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => value}
                    />
                  }
                />
                <Legend />
                <Bar dataKey="profit" fill="#FD5B2B" radius={4} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Average ROI</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-[#FD5B2B]">{averageROI.toFixed(2)}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-[#FD5B2B]">${totalProfit.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
};

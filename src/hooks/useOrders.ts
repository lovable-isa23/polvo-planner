import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/pastry';
import { calculateROI } from '@/lib/calculations';
import { toast } from 'sonner';

export const useOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((order) => ({
        id: order.id,
        name: order.name,
        quantity: order.quantity,
        channel: order.channel as Order['channel'],
        week: order.week,
        pricePerBatch: order.price_per_batch,
        laborHours: order.labor_hours,
        status: order.status as Order['status'],
      }));
    },
  });

  const addOrderMutation = useMutation({
    mutationFn: async (order: Omit<Order, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const orderWithId = { ...order, id: crypto.randomUUID() };
      const metrics = calculateROI(orderWithId);

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          name: order.name,
          quantity: order.quantity,
          channel: order.channel,
          price_per_batch: order.pricePerBatch,
          labor_hours: order.laborHours,
          week: order.week,
          status: order.status,
          roi: metrics.roi,
          profit: metrics.profit,
          profit_per_hour: metrics.profitPerHour,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    orders,
    isLoading,
    addOrder: addOrderMutation.mutateAsync,
  };
};

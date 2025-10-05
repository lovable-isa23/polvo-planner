import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, FlavorQuantity } from '@/types/pastry';
import { calculateROI } from '@/lib/calculations';
import { toast } from 'sonner';

export const useOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch flavor data for each order
      const ordersWithFlavors = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: flavorsData } = await supabase
            .from('order_flavors')
            .select('*')
            .eq('order_id', order.id);

          const flavors: FlavorQuantity[] = (flavorsData || []).map((f) => ({
            flavor: f.flavor_name as FlavorQuantity['flavor'],
            quantity: f.quantity,
            pricePerBatch: Number(f.price_per_batch),
          }));

          return {
            id: order.id,
            name: order.name,
            quantity: order.quantity,
            channel: order.channel as Order['channel'],
            week: order.week,
            pricePerBatch: Number(order.price_per_batch),
            laborHours: Number(order.labor_hours),
            status: order.status as Order['status'],
            flavors: flavors.length > 0 ? flavors : undefined,
          };
        })
      );

      return ordersWithFlavors;
    },
    enabled: true,
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

      // Insert flavor data if present
      if (order.flavors && order.flavors.length > 0) {
        const { error: flavorsError } = await supabase
          .from('order_flavors')
          .insert(
            order.flavors.map((f) => ({
              order_id: data.id,
              flavor_name: f.flavor,
              quantity: f.quantity,
              price_per_batch: f.pricePerBatch,
            }))
          );

        if (flavorsError) throw flavorsError;
      }

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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, FlavorQuantity } from '@/types/pastry';
import { calculateROI } from '@/lib/calculations';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

/**
 * A custom hook for managing orders, including fetching, adding, and updating.
 * It leverages TanStack Query for server-state management and caching,
 * and interacts with a Supabase backend.
 */
export const useOrders = () => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Effect to check and subscribe to Supabase auth state.
  // This ensures that data fetching is only enabled when a user is logged in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetches all orders for the currently authenticated user.
   * It also fetches the associated flavor details for each order in parallel.
   */
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

      // For each order, fetch its related flavors to construct the full order object.
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

          // Shape the final order object to match the application's `Order` type.
          return {
            id: order.id,
            name: order.name,
            quantity: order.quantity,
            channel: order.channel as Order['channel'],
            week: order.week,
            dueDate: order.due_date || order.week, // Fallback to week for older data
            pricePerBatch: Number(order.price_per_batch),
            laborHours: Number(order.labor_hours),
            status: order.status as Order['status'],
            flavors: flavors.length > 0 ? flavors : undefined,
            miscCosts: order.misc_costs ? Number(order.misc_costs) : 0,
          };
        })
      );

      return ordersWithFlavors;
    },
    enabled: isAuthenticated, // Only run the query if the user is authenticated.
    staleTime: 0, // Ensures data is always fresh on mount.
  });

  /**
   * A mutation for adding a new order to the database.
   * It calculates ROI metrics before insertion.
   */
  const addOrderMutation = useMutation({
    mutationFn: async (order: Omit<Order, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Assign a client-side generated UUID to the order.
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
          due_date: order.dueDate,
          status: order.status,
          roi: metrics.roi,
          profit: metrics.profit,
          profit_per_hour: metrics.profitPerHour,
          misc_costs: order.miscCosts || 0,
        })
        .select()
        .single();

      if (error) throw error;

      // If the order includes specific flavors, insert them into the `order_flavors` table.
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
      // When the mutation is successful, invalidate the 'orders' query to refetch the latest data.
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  /**
   * A mutation for updating an existing order.
   * It recalculates ROI metrics and overwrites flavor data.
   */
  const updateOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const metrics = calculateROI(order);

      const { data, error } = await supabase
        .from('orders')
        .update({
          name: order.name,
          quantity: order.quantity,
          channel: order.channel,
          price_per_batch: order.pricePerBatch,
          labor_hours: order.laborHours,
          week: order.week,
          due_date: order.dueDate,
          status: order.status,
          roi: metrics.roi,
          profit: metrics.profit,
          profit_per_hour: metrics.profitPerHour,
          misc_costs: order.miscCosts || 0,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;

      // To ensure flavor data is consistent, delete all existing flavors for the order...
      await supabase
        .from('order_flavors')
        .delete()
        .eq('order_id', order.id);

      // ...and then insert the new set of flavors, if any.
      if (order.flavors && order.flavors.length > 0) {
        const { error: flavorsError } = await supabase
          .from('order_flavors')
          .insert(
            order.flavors.map((f) => ({
              order_id: order.id,
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
      // Invalidate the cache to trigger a refetch of the updated orders list.
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Expose the orders data, loading state, and mutation functions to the component.
  return {
    orders,
    isLoading,
    addOrder: addOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
  };
};
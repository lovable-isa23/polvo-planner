import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FlavorType } from '@/types/pastry';
import { toast } from 'sonner';

export interface FlavorPricing {
  id?: string;
  name: FlavorType;
  pricePerBatch: number;
}

export const DEFAULT_FLAVOR_PRICES: Record<FlavorType, number> = {
  'brown-butter-bites': 10,
  'milo': 12,
  'lolas-mix': 11,
  'cinnamon': 10,
};

export const FLAVOR_LABELS: Record<FlavorType, string> = {
  'brown-butter-bites': 'Brown Butter Bites',
  'milo': 'Milo',
  'lolas-mix': "Lola's Mix",
  'cinnamon': 'Cinnamon',
};

export const useFlavors = () => {
  const queryClient = useQueryClient();

  const { data: flavors = [], isLoading } = useQuery({
    queryKey: ['flavors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flavors')
        .select('*')
        .order('name');

      if (error) throw error;
      
      return (data || []).map((flavor) => ({
        id: flavor.id,
        name: flavor.name as FlavorType,
        pricePerBatch: Number(flavor.price_per_batch),
      }));
    },
  });

  const updateFlavorsMutation = useMutation({
    mutationFn: async (flavorPrices: FlavorPricing[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete all existing flavors
      await supabase.from('flavors').delete().eq('user_id', user.id);

      // Insert new flavor prices
      const { error } = await supabase
        .from('flavors')
        .insert(
          flavorPrices.map((fp) => ({
            user_id: user.id,
            name: fp.name,
            price_per_batch: fp.pricePerBatch,
          }))
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flavors'] });
      toast.success('Flavor prices updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Get flavor prices as a map
  const getFlavorPrices = (): Record<FlavorType, number> => {
    if (flavors.length === 0) return DEFAULT_FLAVOR_PRICES;
    
    const priceMap = { ...DEFAULT_FLAVOR_PRICES };
    flavors.forEach((flavor) => {
      priceMap[flavor.name] = flavor.pricePerBatch;
    });
    return priceMap;
  };

  return {
    flavors,
    isLoading,
    updateFlavors: updateFlavorsMutation.mutateAsync,
    getFlavorPrices,
  };
};

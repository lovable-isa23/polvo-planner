-- Add flavors table to store flavor-specific pricing
CREATE TABLE IF NOT EXISTS public.flavors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  price_per_batch numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flavors ENABLE ROW LEVEL SECURITY;

-- RLS policies for flavors
CREATE POLICY "Users can view their own flavors" 
ON public.flavors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flavors" 
ON public.flavors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flavors" 
ON public.flavors 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flavors" 
ON public.flavors 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add order_flavors table to track flavor quantities per order
CREATE TABLE IF NOT EXISTS public.order_flavors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  flavor_name text NOT NULL,
  quantity integer NOT NULL,
  price_per_batch numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_flavors ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_flavors (tied to parent order's user_id)
CREATE POLICY "Users can view their own order flavors" 
ON public.order_flavors 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_flavors.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own order flavors" 
ON public.order_flavors 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_flavors.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own order flavors" 
ON public.order_flavors 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_flavors.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own order flavors" 
ON public.order_flavors 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_flavors.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates on flavors
CREATE TRIGGER update_flavors_updated_at
BEFORE UPDATE ON public.flavors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
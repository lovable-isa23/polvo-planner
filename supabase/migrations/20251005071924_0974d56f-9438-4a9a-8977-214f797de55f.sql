-- Create preferences table to store user settings
CREATE TABLE public.preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  recipe JSONB NOT NULL DEFAULT '{"flour": 500, "sugar": 300, "butter": 200, "eggs": 4}'::jsonb,
  ingredient_costs JSONB NOT NULL DEFAULT '{"flour": 2, "sugar": 1.5, "butter": 4, "eggs": 0.3}'::jsonb,
  labor_rate NUMERIC NOT NULL DEFAULT 25,
  flavor_prices JSONB NOT NULL DEFAULT '{}'::jsonb,
  business_name TEXT,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences"
ON public.preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_preferences_updated_at
BEFORE UPDATE ON public.preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
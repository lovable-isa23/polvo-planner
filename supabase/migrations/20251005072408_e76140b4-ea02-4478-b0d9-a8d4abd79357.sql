-- Update default recipe values to match application defaults
ALTER TABLE public.preferences 
  ALTER COLUMN recipe SET DEFAULT '{"flour": 4, "powderedMilk": 2, "pinipig": 0.75, "butter": 1.2, "sugar": 1.5}'::jsonb,
  ALTER COLUMN ingredient_costs SET DEFAULT '{"flour": 0.30, "powderedMilk": 1.20, "pinipig": 1.50, "butter": 2.00, "sugar": 0.50}'::jsonb,
  ALTER COLUMN labor_rate SET DEFAULT 22;
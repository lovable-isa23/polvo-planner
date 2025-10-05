-- Add due_date column to orders table
ALTER TABLE public.orders 
ADD COLUMN due_date date;

-- Update existing orders to have a due_date based on their week
-- This is a one-time data migration for existing records
UPDATE public.orders
SET due_date = (
  CASE 
    WHEN week ~ '^\d{4}-W\d{2}$' THEN
      -- Calculate the Monday of the ISO week
      (substring(week from 1 for 4)::integer || '-01-01')::date + 
      (substring(week from 7 for 2)::integer - 1) * 7 - 
      EXTRACT(isodow FROM (substring(week from 1 for 4)::integer || '-01-01')::date)::integer + 1
    ELSE
      CURRENT_DATE
  END
)
WHERE due_date IS NULL;
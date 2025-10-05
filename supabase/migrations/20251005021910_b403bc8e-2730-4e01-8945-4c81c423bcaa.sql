-- Add misc_costs column to orders table for event-related expenses
ALTER TABLE public.orders 
ADD COLUMN misc_costs numeric DEFAULT 0;
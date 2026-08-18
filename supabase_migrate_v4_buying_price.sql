-- ==============================================================================
-- MIGRATION V4: ADD BUYING_PRICE / COST PER PRODUCT TO PRODUCTS TABLE
-- This column stores internal wholesale/buying cost to calculate estimated profit in Stats
-- ==============================================================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS buying_price NUMERIC(10, 2) DEFAULT 0.00;

-- Optional Comment for documentation
COMMENT ON COLUMN public.products.buying_price IS 'Internal unit cost/buying price for calculating gross margin and profit in admin stats. Hidden from customers.';

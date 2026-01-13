-- ============================================
-- Krypto Trac: Database Webhook for Whale Alerts
-- Triggers Edge Function when whale transaction detected
-- ============================================

-- Create webhook function that calls Edge Function
CREATE OR REPLACE FUNCTION public.notify_whale_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_ref TEXT := 'hiuemmkhwiaarpdyncgj'; -- Replace with your project ref
  v_function_url TEXT;
  v_payload JSONB;
BEGIN
  -- Only trigger for whale transactions
  IF NEW.is_whale = TRUE THEN
    v_function_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/whale-alert';
    
    -- Build payload
    v_payload := jsonb_build_object(
      'transaction_id', NEW.id,
      'coin_id', NEW.coin_id,
      'symbol', NEW.symbol,
      'transaction_type', NEW.transaction_type,
      'amount', NEW.amount,
      'total_value_usd', NEW.total_value_usd,
      'transaction_hash', NEW.transaction_hash,
      'network', NEW.network,
      'created_at', NEW.created_at
    );
    
    -- Call Edge Function asynchronously (non-blocking)
    -- Note: This requires pg_net extension or external webhook service
    -- For now, we'll use a database notification that can be picked up by a listener
    PERFORM pg_notify(
      'whale_transaction',
      v_payload::text
    );
    
    RAISE NOTICE 'Whale transaction detected: % % % (Value: $%)', 
      NEW.symbol, NEW.transaction_type, NEW.amount, NEW.total_value_usd;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_whale ON public.transactions;
CREATE TRIGGER trigger_notify_whale
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.is_whale = TRUE)
  EXECUTE FUNCTION public.notify_whale_transaction();

COMMENT ON FUNCTION public.notify_whale_transaction() IS 'Sends notification when whale transaction is detected';

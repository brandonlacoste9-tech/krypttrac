-- ============================================
-- Krypto Trac: Integrate Sentinel Monitoring
-- Adds anomaly detection triggers to existing tables
-- ============================================

-- Trigger: Monitor transactions for anomalies
CREATE OR REPLACE FUNCTION public.monitor_transaction_anomaly()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_avg_transaction NUMERIC;
  v_anomaly_threshold NUMERIC := 10.0; -- 10x average = anomaly
  v_project_ref TEXT := 'hiuemmkhwiaarpdyncgj';
  v_function_url TEXT;
BEGIN
  -- Calculate user's average transaction size
  SELECT AVG(total_value_usd) INTO v_user_avg_transaction
  FROM public.transactions
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '30 days';
  
  -- Check for massive withdrawal anomaly
  IF NEW.total_value_usd > COALESCE(v_user_avg_transaction * v_anomaly_threshold, 100000) THEN
    -- Call Sentinel AI for analysis
    v_function_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/sentinel-anomaly-detection';
    
    -- In production, use pg_net to call Edge Function
    -- For now, we'll create a security event directly
    INSERT INTO public.security_events (
      user_id,
      event_type,
      severity,
      threat_signature,
      metadata,
      ai_confidence
    )
    VALUES (
      NEW.user_id,
      'massive_withdrawal',
      'high',
      'Transaction amount (' || NEW.total_value_usd || ') exceeds 10x user average',
      jsonb_build_object(
        'transaction_id', NEW.id,
        'transaction_amount', NEW.total_value_usd,
        'user_average', v_user_avg_transaction,
        'anomaly_multiplier', NEW.total_value_usd / NULLIF(v_user_avg_transaction, 0)
      ),
      85.0
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_monitor_transaction_anomaly ON public.transactions;
CREATE TRIGGER trigger_monitor_transaction_anomaly
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.total_value_usd > 10000) -- Only monitor large transactions
  EXECUTE FUNCTION public.monitor_transaction_anomaly();

-- Trigger: Monitor user activity for IP anomalies
CREATE OR REPLACE FUNCTION public.monitor_ip_anomaly()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_ips TEXT[];
  v_current_ip TEXT;
BEGIN
  -- Get user's recent IP addresses
  SELECT ARRAY_AGG(DISTINCT ip_address::text)
  INTO v_recent_ips
  FROM public.user_activity_logs
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '7 days'
    AND ip_address IS NOT NULL;
  
  -- Get current IP
  v_current_ip := NEW.ip_address::text;
  
  -- Check if IP is new (not in recent history)
  IF v_current_ip IS NOT NULL AND (v_recent_ips IS NULL OR NOT (v_current_ip = ANY(v_recent_ips))) THEN
    -- Check if user has recent activity (potential session hijack)
    IF EXISTS (
      SELECT 1 FROM public.user_activity_logs
      WHERE user_id = NEW.user_id
        AND created_at > NOW() - INTERVAL '1 hour'
        AND ip_address::text != v_current_ip
    ) THEN
      -- Multiple IPs in short time = potential hijack
      INSERT INTO public.security_events (
        user_id,
        event_type,
        severity,
        threat_signature,
        ip_address,
        metadata
      )
      VALUES (
        NEW.user_id,
        'session_hijack_attempt',
        'critical',
        'Multiple IP addresses detected within 1 hour',
        NEW.ip_address,
        jsonb_build_object(
          'current_ip', v_current_ip,
          'recent_ips', v_recent_ips
        )
      );
    ELSE
      -- New IP but no recent activity = potential anomaly
      INSERT INTO public.security_events (
        user_id,
        event_type,
        severity,
        threat_signature,
        ip_address,
        metadata
      )
      VALUES (
        NEW.user_id,
        'ip_anomaly',
        'medium',
        'Login from new IP address',
        NEW.ip_address,
        jsonb_build_object(
          'current_ip', v_current_ip,
          'recent_ips', v_recent_ips
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_monitor_ip_anomaly ON public.user_activity_logs;
CREATE TRIGGER trigger_monitor_ip_anomaly
  AFTER INSERT ON public.user_activity_logs
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL AND NEW.ip_address IS NOT NULL)
  EXECUTE FUNCTION public.monitor_ip_anomaly();

COMMENT ON FUNCTION public.monitor_transaction_anomaly() IS 'Monitors transactions for massive withdrawal anomalies';
COMMENT ON FUNCTION public.monitor_ip_anomaly() IS 'Monitors user activity for IP address anomalies';

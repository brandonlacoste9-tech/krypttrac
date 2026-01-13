-- ============================================
-- Krypto Trac: News Embeddings Table (pgvector)
-- Stores vector embeddings for AI-powered search and insights
-- ============================================

-- Create news_embeddings table
CREATE TABLE IF NOT EXISTS public.news_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID, -- Reference to news article (if you have a news table)
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  coins_mentioned TEXT[], -- Array of coin symbols mentioned
  sentiment TEXT, -- 'bullish', 'bearish', 'neutral'
  embedding vector(1536), -- OpenAI ada-002 dimension, adjust for your model
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_news_embeddings_embedding ON public.news_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); -- Adjust based on your data size

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_news_embeddings_coins ON public.news_embeddings USING GIN(coins_mentioned);
CREATE INDEX IF NOT EXISTS idx_news_embeddings_sentiment ON public.news_embeddings(sentiment);
CREATE INDEX IF NOT EXISTS idx_news_embeddings_published ON public.news_embeddings(published_at DESC);

-- Enable RLS
ALTER TABLE public.news_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read news embeddings (public data)
DROP POLICY IF EXISTS "News embeddings are publicly readable" ON public.news_embeddings;
CREATE POLICY "News embeddings are publicly readable"
  ON public.news_embeddings FOR SELECT
  USING (true);

-- RLS Policy: Only service_role can insert/update
DROP POLICY IF EXISTS "Service role can manage news embeddings" ON public.news_embeddings;
CREATE POLICY "Service role can manage news embeddings"
  ON public.news_embeddings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to find similar news articles (vector similarity search)
CREATE OR REPLACE FUNCTION public.find_similar_news(
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold NUMERIC DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  content TEXT,
  source TEXT,
  url TEXT,
  coins_mentioned TEXT[],
  sentiment TEXT,
  similarity NUMERIC,
  published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ne.id,
    ne.title,
    ne.content,
    ne.source,
    ne.url,
    ne.coins_mentioned,
    ne.sentiment,
    1 - (ne.embedding <=> p_query_embedding) as similarity, -- Cosine distance to similarity
    ne.published_at
  FROM public.news_embeddings ne
  WHERE ne.embedding IS NOT NULL
    AND 1 - (ne.embedding <=> p_query_embedding) >= p_similarity_threshold
  ORDER BY ne.embedding <=> p_query_embedding -- Order by cosine distance (ascending = most similar)
  LIMIT p_limit;
END;
$$;

-- Function to answer questions using news context (AI assistant)
CREATE OR REPLACE FUNCTION public.answer_crypto_question(
  p_question TEXT,
  p_question_embedding vector(1536),
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  answer_context TEXT,
  relevant_articles JSONB,
  coins_mentioned TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_similar_news RECORD;
  v_context TEXT := '';
  v_articles JSONB := '[]'::jsonb;
  v_coins TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Find similar news articles
  FOR v_similar_news IN
    SELECT * FROM public.find_similar_news(p_question_embedding, p_limit, 0.6)
    ORDER BY similarity DESC
  LOOP
    -- Build context from top articles
    v_context := v_context || E'\n\n' || v_similar_news.title || E'\n' || 
                 LEFT(v_similar_news.content, 500) || '...';
    
    -- Collect articles as JSON
    v_articles := v_articles || jsonb_build_object(
      'title', v_similar_news.title,
      'source', v_similar_news.source,
      'url', v_similar_news.url,
      'sentiment', v_similar_news.sentiment,
      'similarity', v_similar_news.similarity,
      'published_at', v_similar_news.published_at
    );
    
    -- Collect mentioned coins
    IF v_similar_news.coins_mentioned IS NOT NULL THEN
      v_coins := array_cat(v_coins, v_similar_news.coins_mentioned);
    END IF;
  END LOOP;
  
  -- Remove duplicates from coins array
  v_coins := array(SELECT DISTINCT unnest(v_coins));
  
  RETURN QUERY SELECT 
    v_context as answer_context,
    v_articles as relevant_articles,
    v_coins as coins_mentioned;
END;
$$;

COMMENT ON TABLE public.news_embeddings IS 'News articles with vector embeddings for AI-powered search';
COMMENT ON FUNCTION public.find_similar_news(vector, INTEGER, NUMERIC) IS 'Finds similar news articles using vector similarity search';
COMMENT ON FUNCTION public.answer_crypto_question(TEXT, vector, INTEGER) IS 'Answers crypto questions using relevant news context';

// ============================================
// Krypto Trac: IPFS Asset Caching Edge Function
// Fetches assets from IPFS, caches in Supabase Storage, serves via CDN
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CacheRequest {
  ipfs_url: string
  asset_type: 'nft' | 'token_logo' | 'project_asset'
  bucket_name?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { ipfs_url, asset_type, bucket_name }: CacheRequest = await req.json()

    // Determine bucket based on asset type
    const bucket = bucket_name || (
      asset_type === 'nft' ? 'nft-cache' :
      asset_type === 'token_logo' ? 'token-logos' :
      'project-assets'
    )

    // Check if already cached
    const { data: existing } = await supabase
      .from('cached_assets')
      .select('*')
      .eq('source_url', ipfs_url)
      .eq('asset_type', asset_type)
      .single()

    if (existing) {
      // Return cached CDN URL
      const cdnUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${existing.storage_path}`
      
      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          url: cdnUrl,
          cached_at: existing.cached_at,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Fetch from IPFS
    // Convert IPFS URL to HTTP gateway URL
    const ipfsGateway = ipfs_url.replace('ipfs://', 'https://ipfs.io/ipfs/')
    
    const response = await fetch(ipfsGateway, {
      headers: {
        'Accept': 'image/*, application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.status}`)
    }

    // Get file info
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentLength = response.headers.get('content-length')
    const blob = await response.blob()

    // Generate storage path
    const fileName = ipfs_url.split('/').pop() || `asset-${Date.now()}`
    const storagePath = `${asset_type}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, blob, {
        contentType,
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    // Register in database
    const { data: registered } = await supabase.rpc('register_cached_asset', {
      p_source_url: ipfs_url,
      p_asset_type: asset_type,
      p_storage_path: storagePath,
      p_bucket_name: bucket,
      p_file_name: fileName,
      p_mime_type: contentType,
      p_file_size: contentLength ? parseInt(contentLength) : null,
      p_ipfs_hash: ipfs_url.includes('ipfs://') ? ipfs_url.replace('ipfs://', '') : null,
    })

    // Return CDN URL
    const cdnUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        url: cdnUrl,
        cached_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('IPFS cache error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// ============================================
// Krypto Trac: Vertex AI Prompt Optimizer
// Deterministic outputs with JSON-only response guards
// ============================================

/**
 * Optimize prompts for deterministic JSON responses
 */
export function optimizePromptForJSON(
  basePrompt: string,
  schema?: Record<string, any>
): string {
  const jsonGuard = `
IMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no explanations, no code blocks.
If you cannot provide a valid response, return: {"error": "Unable to process request"}

${schema ? `Expected JSON schema: ${JSON.stringify(schema, null, 2)}` : ''}
`

  return `${basePrompt}\n\n${jsonGuard}`
}

/**
 * Parse and validate JSON response from Vertex AI
 */
export function parseJSONResponse<T>(
  response: string,
  schema?: Record<string, any>
): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim()
  
  // Remove ```json and ``` markers
  cleaned = cleaned.replace(/^```json\s*/i, '')
  cleaned = cleaned.replace(/^```\s*/i, '')
  cleaned = cleaned.replace(/\s*```$/i, '')
  
  // Extract JSON from response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]) as T
    
    // Basic schema validation
    if (schema) {
      validateSchema(parsed, schema)
    }
    
    return parsed
  } catch (error) {
    throw new Error(`Invalid JSON response: ${error}`)
  }
}

/**
 * Basic schema validation
 */
function validateSchema(data: any, schema: Record<string, any>): void {
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in data)) {
      throw new Error(`Missing required field: ${key}`)
    }
    
    const value = data[key]
    const expectedType = typeof type === 'string' ? type : typeof type
    
    if (typeof value !== expectedType) {
      throw new Error(`Invalid type for ${key}: expected ${expectedType}, got ${typeof value}`)
    }
  }
}

/**
 * Create deterministic prompt with persona switching
 */
export function createDeterministicPrompt(
  persona: 'sentinel' | 'analyst' | 'advisor',
  task: string,
  context?: Record<string, any>
): string {
  const personas = {
    sentinel: {
      tone: 'Security-focused, precise, risk-averse',
      instructions: 'Focus on security threats, vulnerabilities, and risk assessment. Be conservative in assessments.',
    },
    analyst: {
      tone: 'Data-driven, analytical, objective',
      instructions: 'Provide data-driven analysis with confidence scores. Base conclusions on evidence.',
    },
    advisor: {
      tone: 'Helpful, clear, actionable',
      instructions: 'Provide clear, actionable advice. Explain reasoning in simple terms.',
    },
  }
  
  const selected = personas[persona]
  
  return `
You are a ${selected.tone} AI assistant for Krypto Trac.

${selected.instructions}

Task: ${task}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Respond with ONLY valid JSON. No markdown, no explanations.
`
}

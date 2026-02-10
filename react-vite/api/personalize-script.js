/**
 * Vercel Serverless Function: Personalize Ritual Scripts
 * Uses OpenAI to generate context-aware scripts based on user input
 */

export const config = {
  runtime: 'edge',
}

const SYSTEM_PROMPT = `You are a calm, empathetic wellness guide creating personalized micro-ritual scripts.

Your task: Take a generic ritual script and personalize it based on what the user shared about their current state.

Rules:
1. Keep the same structure and timing as the original script (same number of prompts)
2. Weave in references to what the user specifically mentioned
3. Use warm, supportive, second-person language ("you", not "we")
4. Keep each prompt to 1-2 short sentences (will be spoken aloud)
5. Don't add medical advice or diagnoses
6. Match the tone to the user's emotional state (gentler for grief/panic, more energetic for positive states)
7. Never use emojis or special characters
8. Output ONLY a JSON array of strings, nothing else

Example input:
- User said: "I'm so stressed about my job interview tomorrow"
- Ritual: Box Breathing
- Original script: ["Inhale for 4 counts.", "Hold for 4 counts.", "Exhale for 4 counts.", "Hold for 4 counts."]

Example output:
["That interview is weighing on you. Let's calm your mind. Inhale confidence for 4 counts.", "Hold that steady energy. You've prepared for this. 4 counts.", "Exhale the worry about tomorrow. Let it go for 4 counts.", "Rest in the stillness. You are ready. Hold for 4 counts."]`

export default async function handler(req) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { userInput, ritualLabel, originalScript, emotionalState, tags } = await req.json()

    if (!userInput || !ritualLabel || !originalScript) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Fallback to original script if no API key
      return new Response(
        JSON.stringify({ script: originalScript, personalized: false }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const userPrompt = `User shared: "${userInput}"

Detected emotional state: ${emotionalState}
Detected themes: ${tags?.join(', ') || 'general'}

Ritual: ${ritualLabel}
Original script to personalize:
${JSON.stringify(originalScript)}

Generate a personalized version of this script that speaks directly to what the user shared. Output ONLY the JSON array.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      // Fallback to original script
      return new Response(
        JSON.stringify({ script: originalScript, personalized: false }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    // Parse the JSON array from the response
    let personalizedScript
    try {
      personalizedScript = JSON.parse(content)
      if (!Array.isArray(personalizedScript)) {
        throw new Error('Not an array')
      }
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content)
      // Fallback to original
      return new Response(
        JSON.stringify({ script: originalScript, personalized: false }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    return new Response(
      JSON.stringify({ script: personalizedScript, personalized: true }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )

  } catch (error) {
    console.error('Error in personalize-script:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

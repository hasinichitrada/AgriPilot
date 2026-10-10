import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import type { AnalysisRequest, ReportData } from './src/types/agri.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Generous limit for high-resolution crop photos in base64
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

const EXACT_N8N_CHAT_WEBHOOK_URL = 'https://darahasini.app.n8n.cloud/webhook/90b085a3-07b9-4933-8ca8-a7d1054e9dfb/chat';
const EXACT_N8N_INSTANCE_ID = '253e3166345b778f38e88e55dc0b9c1595ac579c1c762e04d51c7d46db8dbeaf';

/**
 * Detects whether a string is raw code, workflow JSON, n8n schema, or programming dump
 * rather than a helpful agricultural advisory answer for a farmer.
 */
function isCodeOrWorkflowDump(text: string): boolean {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();

  // Too short or empty
  if (trimmed.length < 5) return true;

  // Raw JSON object/array markers
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    if (
      trimmed.includes('"nodes"') ||
      trimmed.includes('"parameters"') ||
      trimmed.includes('"typeVersion"') ||
      trimmed.includes('"type":') ||
      trimmed.includes('"connections"') ||
      trimmed.includes('"action":') ||
      trimmed.includes('"webhook"')
    ) {
      return true;
    }
  }

  // n8n workflow or langchain signatures
  if (
    trimmed.includes('@n8n/n8n-nodes') ||
    trimmed.includes('respondToWebhook') ||
    trimmed.includes('"chainLlm"') ||
    trimmed.includes('action-router') ||
    trimmed.includes('diagnostic-agent-chain') ||
    trimmed.includes('clean-json-output')
  ) {
    return true;
  }

  // Technical setup guides or code instructions
  if (
    trimmed.includes('Setup & Deployment Guide') ||
    trimmed.includes('Import the Workflow to n8n') ||
    trimmed.includes('Configure Google Gemini Credentials') ||
    trimmed.includes('How to Test Your Endpoints') ||
    trimmed.includes('curl -X POST') ||
    trimmed.includes('curl -s -X POST')
  ) {
    return true;
  }

  // Heavy density of JSON keys without natural agricultural sentences
  const jsonKeyMatches = (trimmed.match(/"[a-zA-Z0-9_-]{2,}":/g) || []).length;
  if (jsonKeyMatches >= 6) {
    return true;
  }

  // Code fence markers containing JSON or script blocks
  if (
    trimmed.includes('```json') ||
    trimmed.includes('```javascript') ||
    trimmed.includes('```typescript') ||
    trimmed.includes('```bash')
  ) {
    // If more than 50% of the message is inside a code block and not natural language
    if (trimmed.includes('"parameters"') || trimmed.includes('"nodes"')) {
      return true;
    }
  }

  return false;
}

/**
 * Strips raw code fences, JSON artifacts, and cleans text for farmers.
 */
function cleanAndSanitizeAdvisoryText(raw: string): string {
  if (!raw) return '';
  let cleaned = raw;

  // Remove markdown code fences if they wrap the entire message or JSON
  if (cleaned.startsWith('```json') || cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
  }

  // Remove standalone code blocks if any
  cleaned = cleaned.replace(/```(?:json|bash|javascript|typescript)?\s*[\s\S]*?```/gi, (match) => {
    // If the block is workflow json, remove it
    if (match.includes('"parameters"') || match.includes('"nodes"') || match.includes('curl -X')) {
      return '';
    }
    return match;
  });

  return cleaned.trim();
}

/**
 * Intelligently extracts the farmer-facing response from the n8n agent output,
 * parsing JSON payloads, Telugu/English sections, or raw advisory text.
 */
function extractFarmerAnswerFromN8n(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();

  // Try parsing direct JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.reply && typeof parsed.reply === 'string') return cleanAndSanitizeAdvisoryText(parsed.reply);
    if (parsed.output && typeof parsed.output === 'string') return extractFarmerAnswerFromN8n(parsed.output);
    if (parsed.message && typeof parsed.message === 'string') return cleanAndSanitizeAdvisoryText(parsed.message);
  } catch (_) {}

  // If text contains a JSON block with reply
  const replyMatch = trimmed.match(/"reply":\s*"([^"]+)"/);
  if (replyMatch && replyMatch[1] && replyMatch[1].length > 15) {
    try {
      return cleanAndSanitizeAdvisoryText(JSON.parse(`"${replyMatch[1]}"`));
    } catch {
      return cleanAndSanitizeAdvisoryText(replyMatch[1]);
    }
  }

  // If text contains Section 1 / భాగం 1 in Telugu
  if (trimmed.includes('## భాగం 1:') || trimmed.includes('# భాగం 1:')) {
    const part1Start = trimmed.search(/#+\s*భాగం 1:/);
    if (part1Start !== -1) {
      const afterStart = trimmed.slice(part1Start);
      const nextPart = afterStart.search(/---+\s*#+\s*భాగం 2|#+\s*భాగం 2|```json/);
      if (nextPart !== -1) {
        return cleanAndSanitizeAdvisoryText(afterStart.slice(0, nextPart));
      }
    }
  }

  // If text contains Part 1:
  if (trimmed.includes('### Part 1:') || trimmed.includes('## Part 1:')) {
    const part1Start = trimmed.search(/#+\s*Part 1:/);
    if (part1Start !== -1) {
      const afterStart = trimmed.slice(part1Start);
      const nextPart = afterStart.search(/---+\s*#+\s*Part 2|#+\s*Part 2|```json/);
      if (nextPart !== -1) {
        return cleanAndSanitizeAdvisoryText(afterStart.slice(0, nextPart));
      }
    }
  }

  return cleanAndSanitizeAdvisoryText(trimmed);
}

/**
 * Generates a detailed, beautifully structured agricultural advisory or report
 * based directly on the farmer's question in the selected language (English or Telugu).
 */
async function generateStructuredAgriculturalAdvisory(
  userQuery: string,
  language: 'en' | 'te',
  crop?: string,
  rawAgentNotes?: string
): Promise<string> {
  const ai = new GoogleGenAI();
  const isTe = language === 'te';

  const systemInstruction = `You are AgriPilot, a senior agricultural extension scientist and plant health companion for farmers.
The farmer asked a question or described a crop issue: "${userQuery}".
Crop context: ${crop || 'Not specified'}.

YOUR MANDATE:
Generate a HIGHLY DETAILED, WELL-STRUCTURED AGRICULTURAL ANSWER OR REPORT based directly on the farmer's question.
DO NOT output random text, code, JSON, bash commands, n8n workflows, or programming technicalities.
The farmer needs practical, scientifically grounded, respectful farming advisory.

LANGUAGE:
${isTe 
  ? 'Strictly in TELUGU (తెలుగు లిపి). Use authentic, respectful, clear Telugu farming terminology (e.g. పసుపు తెగులు, బూడిద తెగులు, రసం పీల్చే పురుగులు, పోషకాల లోపం, పొటాష్, యూరియా, పచ్చిరొట్ట ఎరువులు, కృషి విజ్ఞాన కేంద్రం, మండల వ్యవసాయ అధికారి).'
  : 'In clear, practical, supportive ENGLISH suited for Indian farming conditions.'}

REQUIRED STRUCTURE:
Format your answer with clear markdown headings, emojis, bullet points, and numbered action steps:

${isTe ? `
🌾 సమస్య అవలోకనం & ప్రాథమిక నిర్ధారణ (Problem Overview & Diagnosis)
- రైతు పేర్కొన్న సమస్య లేదా లక్షణాల విశ్లేషణ.
- ఇది ఏ తెగులు, పురుగు, పోషక లోపం లేదా వాతావరణ ఒత్తిడి వల్ల వచ్చి ఉండవచ్చో సులభంగా వివరించండి.

🔍 ప్రధాన లక్షణాలు & సంభవనీయ కారణాలు (Key Symptoms & Causes)
- కనిపించే గుర్తులు (ఆకుల రంగు మార్పు, మచ్చలు, ఎండిపోవడం మొదలైనవి).
- సమస్య రావడానికి గల ముఖ్య కారణాలు (తేమ, వర్షాలు, నత్రజని అధికంగా వాడటం లేదా పోషక లోపాలు).

📋 తక్షణ నివారణ చర్యలు (Immediate Action Steps)
1. పొలంలో వెంటనే తనిఖీ చేయాల్సిన అంశాలు.
2. వెంటనే చేపట్టాల్సిన నివారణ చర్యలు (సేంద్రియ/ప్రాథమిక యాజమాన్యం).
3. అవసరమైతే సిఫార్సు చేసిన రక్షణ చర్యలు మరియు మోతాదు.

🛡️ ముందస్తు జాగ్రత్తలు & దీర్ఘకాలిక యాజమాన్యం (Preventive Field Care)
- విత్తన శుద్ధి, సరైన దూరంలో నాట్లు, కలుపు నివారణ.
- సమతుల్య ఎరువుల యాజమాన్యం (NPK).

⚠️ నివారించవలసిన పొరపాట్లు (Strict Precautions / What to Avoid)
- అధిక యూరియా వాడకం, నీరు నిల్వ ఉండటం లేదా నిర్ధారణ లేకుండా రసాయనాలు పిచికారీ చేయడం నివారించండి.

👨‍🌾 వ్యవసాయ నిపుణుల సంప్రదింపు (Expert Support)
- సమస్య తీవ్రమైతే స్థానిక మండల వ్యవసాయ అధికారి (MAO) లేదా కృషి విజ్ఞాన కేంద్రం (KVK) శాస్త్రవేత్తలను ఎప్పుడు సంప్రదించాలో తెలపండి.
` : `
🌾 Problem Overview & Diagnosis
- Clear, plain-language assessment of the farmer's query and crop condition.
- Likely disease, pest, nutrient deficiency, or physiological disorder.

🔍 Key Symptoms & Plausible Causes
- Observable signs on leaves, stems, roots, or fruits.
- Primary contributing factors (excess moisture, high humidity, nutritional imbalance, pest vectors).

📋 Immediate Action Steps (Numbered Practical Plan)
1. Immediate field check (inspect leaf undersides, root zone, soil moisture).
2. Immediate relief measures (cultural sanitation, bio-controls).
3. Recommended management practices with safe, calibrated guidelines.

🛡️ Preventive Field Care & Cultural Practices
- Crop rotation, certified seed treatment, proper plant spacing, drainage.
- Balanced soil fertility management (NPK balance based on soil test).

⚠️ Critical Precautions & What to Avoid
- Avoid excessive nitrogen/urea during disease flare-up.
- Avoid indiscriminate prophylactic chemical cocktails.
- Avoid water stagnation or overhead splashing.

👨‍🌾 When to Seek Agricultural Officer / KVK Assistance
- Specific threshold when the farmer should contact the local Mandal Agriculture Officer (MAO) or Krishi Vigyan Kendra (KVK).
`}

Tone: Encouraging, respectful, scientific, and actionable. Zero code.`;

  const prompt = `FARMER QUERY:
"${userQuery}"
${crop ? `Crop: ${crop}` : ''}
${rawAgentNotes && !isCodeOrWorkflowDump(rawAgentNotes) ? `Diagnostic Notes: ${rawAgentNotes.slice(0, 600)}` : ''}

Please provide the detailed, structured agricultural answer or report now:`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [{ text: prompt }],
    config: { systemInstruction }
  });

  return (response.text || '').trim();
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    n8nChatbotConfigured: true,
    n8nChatWebhookUrl: EXACT_N8N_CHAT_WEBHOOK_URL
  });
});

// Interactive Chat with n8n Agent Endpoint (Exact Webhook Proxy with Agricultural Advisory Structuring)
app.post('/api/chat-n8n', async (req, res) => {
  const { message, chatInput, sessionId, conversationId, language = 'en', crop, timestamp } = req.body;

  const actualMessage = (message || chatInput || '').trim();
  if (!actualMessage) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const activeSessionId = sessionId || conversationId || `agri-session-${Date.now()}`;
  const activeConvId = conversationId || sessionId || activeSessionId;
  const isTe = language === 'te';

  // Exact JSON payload specified for the n8n agent workflow
  const payload: Record<string, any> = {
    action: 'sendMessage',
    chatInput: actualMessage,
    message: actualMessage,
    sessionId: activeSessionId,
    conversationId: activeConvId,
    language: isTe ? 'te' : 'en',
    timestamp: timestamp || new Date().toISOString()
  };

  if (crop && typeof crop === 'string' && crop.trim()) {
    payload.crop = crop.trim();
  }

  try {
    const controller = new AbortController();
    // 55s timeout allowing n8n LLM generation before fallback
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    let n8nReplyText = '';
    let n8nData: any = null;

    try {
      const n8nResponse = await fetch(EXACT_N8N_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
          'X-Instance-Id': EXACT_N8N_INSTANCE_ID,
          'User-Agent': 'AgriPilot-Chatbot-Client/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (n8nResponse.ok) {
        const contentType = n8nResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          n8nData = await n8nResponse.json();
        } else {
          const textOutput = await n8nResponse.text();
          try {
            n8nData = JSON.parse(textOutput);
          } catch {
            n8nData = { reply: textOutput };
          }
        }

        if (typeof n8nData === 'string') {
          n8nReplyText = extractFarmerAnswerFromN8n(n8nData);
        } else if (n8nData && typeof n8nData === 'object') {
          const rawCandidate =
            n8nData.output ||
            n8nData.reply ||
            n8nData.text ||
            n8nData.response ||
            n8nData.message ||
            '';
          n8nReplyText = extractFarmerAnswerFromN8n(rawCandidate);
        }
      } else {
        console.warn(`n8n webhook responded with status ${n8nResponse.status}, falling back to advisory generator.`);
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.warn('n8n fetch aborted or failed:', fetchErr.message);
    }

    // Check if the reply is a code/workflow dump, empty, or lacks actual agricultural text
    let finalStructuredAnswer = '';
    const needsStructuredGeneration =
      !n8nReplyText ||
      isCodeOrWorkflowDump(n8nReplyText) ||
      actualMessage.toLowerCase().includes('report') ||
      actualMessage.includes('నివేదిక');

    if (needsStructuredGeneration) {
      // Synthesize a detailed, structured agricultural advisory/report based directly on the question
      try {
        finalStructuredAnswer = await generateStructuredAgriculturalAdvisory(
          actualMessage,
          isTe ? 'te' : 'en',
          crop,
          n8nReplyText && !isCodeOrWorkflowDump(n8nReplyText) ? n8nReplyText : undefined
        );
      } catch (genErr: any) {
        console.error('Advisory generation fallback error:', genErr);
        // Clean fallback
        finalStructuredAnswer = cleanAndSanitizeAdvisoryText(n8nReplyText) ||
          (isTe
            ? 'క్షమించండి, మీ ప్రశ్నకు సమాధానాన్ని రూపొందించడంలో సాంకేతిక సమస్య ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
            : 'We could not generate the agricultural advisory right now. Please try again.');
      }
    } else {
      // Natural agricultural text was returned by the agent: sanitize any stray code fences
      finalStructuredAnswer = cleanAndSanitizeAdvisoryText(n8nReplyText);
    }

    return res.json({
      success: true,
      reply: finalStructuredAnswer,
      raw: n8nData
    });
  } catch (err: any) {
    console.error('Error in /api/chat-n8n:', err);
    try {
      const emergencyAnswer = await generateStructuredAgriculturalAdvisory(
        actualMessage,
        isTe ? 'te' : 'en',
        crop
      );
      return res.json({
        success: true,
        reply: emergencyAnswer
      });
    } catch {
      return res.status(500).json({
        error: isTe
          ? 'సాంకేతిక లోపం ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
          : 'An unexpected error occurred. Please try again.'
      });
    }
  }
});


// Test n8n webhook endpoint connectivity
app.post('/api/test-n8n', async (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return res.status(400).json({ success: false, error: 'Webhook URL is required.' });
  }

  const isExactN8n =
    webhookUrl.includes('90b085a3-07b9-4933-8ca8-a7d1054e9dfb') ||
    webhookUrl.trim() === EXACT_N8N_CHAT_WEBHOOK_URL;

  const testHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/plain',
    'User-Agent': 'AgriPilot-Diagnostic-Client/1.0'
  };

  if (isExactN8n) {
    testHeaders['X-Instance-Id'] = EXACT_N8N_INSTANCE_ID;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: testHeaders,
      body: JSON.stringify({
        action: 'sendMessage',
        chatInput: 'Connection test from AgriPilot',
        message: 'Connection test from AgriPilot',
        sessionId: 'test-session-ping',
        conversationId: 'test-conv-ping',
        language: 'en',
        timestamp: new Date().toISOString(),
        client: 'AgriPilot'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        message: 'Successfully reached n8n webhook endpoint! The AI agent is active and responded.'
      });
    } else {
      const errText = await response.text().catch(() => '');
      return res.status(response.status).json({
        success: false,
        status: response.status,
        error: `Endpoint returned HTTP status ${response.status}: ${errText.slice(0, 150) || response.statusText}`
      });
    }
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    return res.status(500).json({
      success: false,
      error: isTimeout
        ? 'Connection timed out after 45 seconds. The webhook took too long to respond.'
        : `Could not reach n8n webhook: ${err.message || 'Unknown network error'}`
    });
  }
});

// Complete Report Translation Endpoint
app.post('/api/translate-report', async (req, res) => {
  try {
    const { report, targetLanguage } = req.body;

    if (!report || !targetLanguage || (targetLanguage !== 'en' && targetLanguage !== 'te')) {
      return res.status(400).json({ error: 'Valid report object and targetLanguage (en or te) are required.' });
    }

    // If report is already in the target language, return as-is
    if (report.language === targetLanguage) {
      return res.json(report);
    }

    const ai = new GoogleGenAI();
    const isTe = targetLanguage === 'te';

    const systemInstruction = `You are AgriPilot's agricultural translation engine.
Your task is to translate an existing agricultural crop report faithfully into ${isTe ? 'Telugu (తెలుగు లిపి)' : 'English'}.

CRITICAL TRANSLATION REQUIREMENTS:
1. Translate EVERY single sentence, bullet point, observation, possible cause, action step, warning, precaution, limitation, and explanation.
2. PRESERVE ALL underlying biological facts, identified symptoms, causes, confidence level, and practical advice. Do NOT invent new findings or modify numbers.
3. Keep standard crop names, chemical names, scientific names accurate.
4. Keep all JSON keys strictly identical in English. Translate only the string values.
5. Return a STRICT JSON object matching the exact input structure.`;

    const prompt = `Translate this entire agricultural report into ${isTe ? 'natural, respectful, farmer-friendly Telugu (తెలుగు)' : 'clear, practical English'}:

${JSON.stringify({
  section1_summary: report.section1_summary,
  section2_whatHappened: report.section2_whatHappened,
  section3_whyHappened: report.section3_whyHappened,
  section4_confidence: report.section4_confidence,
  section5_recommendedActions: report.section5_recommendedActions,
  section6_prevention: report.section6_prevention,
  section7_expertHelp: report.section7_expertHelp,
  section8_limitations: report.section8_limitations
}, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ text: prompt }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    let translatedJson: any;
    try {
      translatedJson = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      translatedJson = JSON.parse(cleaned);
    }

    const translatedReport: ReportData = {
      ...report,
      id: report.id,
      createdAt: report.createdAt,
      language: targetLanguage,
      cropName: report.cropName,
      farmerName: report.farmerName,
      location: report.location,
      imageUrl: report.imageUrl,
      section1_summary: translatedJson.section1_summary || report.section1_summary,
      section2_whatHappened: translatedJson.section2_whatHappened || report.section2_whatHappened,
      section3_whyHappened: translatedJson.section3_whyHappened || report.section3_whyHappened,
      section4_confidence: translatedJson.section4_confidence || report.section4_confidence,
      section5_recommendedActions: translatedJson.section5_recommendedActions || report.section5_recommendedActions,
      section6_prevention: translatedJson.section6_prevention || report.section6_prevention,
      section7_expertHelp: translatedJson.section7_expertHelp || report.section7_expertHelp,
      section8_limitations: translatedJson.section8_limitations || report.section8_limitations,
      engineUsed: report.engineUsed
    };

    return res.json(translatedReport);
  } catch (err: any) {
    console.error('Error in report translation:', err);
    return res.status(500).json({ error: `Translation failed: ${err.message || 'Unknown error'}` });
  }
});

// Primary crop analysis endpoint
app.post('/api/analyze-crop', async (req, res) => {
  try {
    const payload: AnalysisRequest = req.body;

    const {
      farmerName,
      email,
      location,
      crop,
      growthStage,
      problemDuration,
      recentPractices,
      language = 'en',
      message = '',
      conversationId = `agri-${Date.now()}`,
      image,
      n8nWebhookUrl,
      useBuiltinAI
    } = payload;

    // Validate that at least an image or message is provided
    if (!message.trim() && (!image || !image.data)) {
      return res.status(400).json({
        error: language === 'te'
          ? 'దయచేసి పంట ఫోటో లేదా సమస్య వివరణను అందించండి.'
          : 'Please provide either a crop photo or a problem description.'
      });
    }

    const targetN8nUrl = n8nWebhookUrl?.trim() || (!useBuiltinAI ? EXACT_N8N_CHAT_WEBHOOK_URL : undefined);

    // If an n8n webhook is specified and not explicitly opting for built-in AI
    if (targetN8nUrl && !useBuiltinAI) {
      try {
        const n8nPayload = {
          action: 'analyze_crop',
          farmerName: farmerName || '',
          email: email || '',
          location: location || '',
          crop: crop || '',
          growthStage: growthStage || '',
          problemDuration: problemDuration || '',
          recentPractices: recentPractices || '',
          language,
          message,
          conversationId,
          image: image ? {
            data: image.data,
            mimeType: image.mimeType,
            filename: image.filename
          } : null
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const n8nResponse = await fetch(targetN8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AgriPilot-Farmer-Applet/1.0'
          },
          body: JSON.stringify(n8nPayload),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!n8nResponse.ok) {
          const errorText = await n8nResponse.text();
          throw new Error(`n8n webhook returned status ${n8nResponse.status}: ${errorText.slice(0, 150)}`);
        }

        const n8nResult = await n8nResponse.json();

        // Check if n8n returned structured report format
        if (
          n8nResult &&
          n8nResult.section1_summary &&
          typeof n8nResult.section1_summary === 'object' &&
          !isCodeOrWorkflowDump(JSON.stringify(n8nResult.section1_summary))
        ) {
          const validatedReport: ReportData = {
            id: n8nResult.id || `rep-${Date.now()}`,
            createdAt: n8nResult.createdAt || new Date().toISOString(),
            language,
            cropName: crop || n8nResult.cropName,
            farmerName: farmerName || n8nResult.farmerName,
            location: location || n8nResult.location,
            imageUrl: image?.data ? `data:${image.mimeType};base64,${image.data}` : undefined,
            section1_summary: n8nResult.section1_summary,
            section2_whatHappened: n8nResult.section2_whatHappened,
            section3_whyHappened: n8nResult.section3_whyHappened,
            section4_confidence: n8nResult.section4_confidence,
            section5_recommendedActions: n8nResult.section5_recommendedActions,
            section6_prevention: n8nResult.section6_prevention,
            section7_expertHelp: n8nResult.section7_expertHelp,
            section8_limitations: n8nResult.section8_limitations,
            engineUsed: 'n8n'
          };
          return res.json(validatedReport);
        } else {
          // n8n returned either text, workflow dump, or non-schema response.
          // Extract any genuine agricultural notes if available to enrich the report.
          const rawReply = n8nResult?.reply || n8nResult?.output || n8nResult?.text || n8nResult?.message || '';
          const cleanedNotes = (!isCodeOrWorkflowDump(rawReply) ? cleanAndSanitizeAdvisoryText(rawReply) : '');
          if (cleanedNotes) {
            console.log('Incorporating clean n8n agent diagnostic notes into full report generation.');
          }
        }
      } catch (n8nErr: any) {
        console.warn('n8n request failed or timed out:', n8nErr.message);
        if (!process.env.GEMINI_API_KEY) {
          return res.status(502).json({
            error: `Failed to connect to n8n webhook (${n8nErr.message}). Please verify that your n8n workflow is active.`
          });
        }
      }
    }

    // Built-in Gemini Engine using @google/genai
    const ai = new GoogleGenAI();

    const isTelugu = language === 'te';

    const systemInstruction = `You are AgriPilot, a senior agricultural extension scientist and plant pathologist companion for farmers.
Your job is to analyze crop health issues submitted by farmers, which may include an uploaded crop image, a farmer's spoken or written symptom description (in Telugu or English), and optional farm details.

CORE SCIENTIFIC PRINCIPLES:
1. Distinguish VISIBLE OBSERVATIONS from INTERPRETATIONS. Never state that a disease, pest, or nutrient deficiency is 100% confirmed solely from a photograph.
2. Formulate plausible causes based on evidence. Identify what evidence fits and what evidence is missing or needed to confirm.
3. Show calibrated assessment confidence (High, Moderate, Tentative, Low) and explain uncertainty clearly. Do NOT invent uncalibrated percentages.
4. Give a numbered, practical action plan:
   - What the farmer can check immediately in their field (e.g. soil moisture, leaf underside, stem base).
   - What practical cultural or bio-friendly steps may help the crop immediately without risk.
   - What conditions to monitor over the next 2-5 days.
   - What actions to strictly AVOID (e.g. avoid overhead watering, avoid excess nitrogen urea, do not spray unknown chemicals indiscriminately).
   - When further testing or expert help is necessary.
5. Highlight when to consult a qualified local agricultural officer, Mandal Agriculture Officer, or local Krishi Vigyan Kendra (KVK).
6. State limitations and unavailable information honestly (e.g. weather history, soil pH, lab culture).
7. LANGUAGE REQUIREMENT:
   The requested language is: "${language}".
   ${isTelugu 
     ? 'CRITICAL: Write ALL field text content, titles, explanations, and advice in natural, respectful, and easily understandable Telugu (తెలుగు script). Keep JSON keys strictly in English. Use farmer-friendly Telugu agricultural terminology (e.g., తెగులు, పురుగులు, పోషకాల లోపం, కృషి విజ్ఞాన కేంద్రం, శాఖీయ దశ).'
     : 'Write all content in clear, practical, supportive English suited for farmers.'}

Return a STRICT JSON object with this exact structure:
{
  "section1_summary": {
    "farmerProblemSummary": "Clear summary of what the farmer reported",
    "visibleImageObservations": ["Observation 1", "Observation 2"]
  },
  "section2_whatHappened": {
    "possibleIssueOverview": "Explanation of the possible crop issue in simple language",
    "visibleSigns": ["Sign 1", "Sign 2"],
    "observationsVsInterpretation": "Clear statement distinguishing what is visibly observed vs what is an interpretation"
  },
  "section3_whyHappened": {
    "plausibleCauses": [
      {
        "cause": "Name of plausible cause (e.g., Fungal Leaf Spot / పోషక లోపం)",
        "explanation": "Why this happens",
        "fittingEvidence": "What evidence in the image/text supports this",
        "missingEvidence": "What missing evidence is needed to confirm"
      }
    ]
  },
  "section4_confidence": {
    "confidenceLevel": "Moderate", // Must be one of: "High", "Moderate", "Tentative", "Low"
    "confidenceExplanation": "Explanation of why this confidence level was chosen",
    "keyUncertainties": ["Uncertainty 1", "Uncertainty 2"]
  },
  "section5_recommendedActions": {
    "immediateChecks": ["1. Check...", "2. Inspect..."],
    "culturalSteps": ["1. Action...", "2. Action..."],
    "monitoringConditions": ["1. Monitor...", "2. Watch for..."],
    "actionsToAvoid": ["1. Do not...", "2. Avoid..."],
    "furtherTestingNotes": "Guidance on lab tests or soil/leaf sampling"
  },
  "section6_prevention": {
    "recommendations": ["Prevention step 1", "Prevention step 2"]
  },
  "section7_expertHelp": {
    "contactThreshold": "When the farmer must immediately call an expert",
    "recommendedOffices": [
      "${isTelugu ? 'స్థానిక కృషి విజ్ఞాన కేంద్రం (KVK)' : 'Local Krishi Vigyan Kendra (KVK)'}",
      "${isTelugu ? 'మండల వ్యవసాయ అధికారి (MAO) / రైతు భరోసా కేంద్రం' : 'Mandal Agriculture Officer / Village Agriculture Extension Assistant'}"
    ]
  },
  "section8_limitations": {
    "diagnosticLimitations": ["Visual assessment alone cannot replace lab culture", "Soil chemical composition unknown"],
    "unavailableInfo": ["Soil test reports", "Microclimate humidity log"],
    "disclaimer": "${isTelugu ? 'గమనిక: ఈ నివేదిక ఒక ప్రాథమిక డిజిటల్ మార్గదర్శకత్వం మాత్రమే. రసాయన మందుల వాడకానికి ముందు స్థానిక వ్యవసాయ అధికారి లేదా KVK నిపుణులను సంప్రదించండి.' : 'Notice: This report is a preliminary digital advisory tool based on visual observation and farmer inputs. Confirm with local extension officers or KVK agronomists before chemical interventions.'}"
  }
}`;

    const promptUserText = `FARMER CONSULTATION DETAILS:
- Farmer Name: ${farmerName || 'Not specified'}
- Location: ${location || 'Not specified'}
- Crop: ${crop || 'Not specified'}
- Growth Stage: ${growthStage || 'Not specified'}
- Problem Duration: ${problemDuration || 'Not specified'}
- Recent Irrigation/Fertilizer/Pesticide: ${recentPractices || 'Not specified'}
- Farmer's Description / Voice Input: "${message || 'No written description, please analyze the photo directly'}"
- Requested Language: ${language} (${isTelugu ? 'Telugu / తెలుగు' : 'English'})

Analyze the provided data thoroughly following the 8 sections schema strictly.`;

    const contents: any[] = [];

    if (image && image.data && image.mimeType) {
      contents.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }

    contents.push({
      text: promptUserText
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      // Clean possible markdown code fences if any
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    const report: ReportData = {
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString(),
      language,
      cropName: crop || (isTelugu ? 'పంట' : 'Crop'),
      farmerName: farmerName || undefined,
      location: location || undefined,
      imageUrl: image?.data ? `data:${image.mimeType};base64,${image.data}` : undefined,
      section1_summary: parsedData.section1_summary || {
        farmerProblemSummary: message || 'Crop issue analysis',
        visibleImageObservations: ['Visual inspection performed']
      },
      section2_whatHappened: parsedData.section2_whatHappened || {
        possibleIssueOverview: 'Preliminary assessment generated.',
        visibleSigns: [],
        observationsVsInterpretation: 'Visual observation only.'
      },
      section3_whyHappened: parsedData.section3_whyHappened || { plausibleCauses: [] },
      section4_confidence: parsedData.section4_confidence || {
        confidenceLevel: 'Moderate',
        confidenceExplanation: 'Based on submitted symptoms.',
        keyUncertainties: []
      },
      section5_recommendedActions: parsedData.section5_recommendedActions || {
        immediateChecks: [],
        culturalSteps: [],
        monitoringConditions: [],
        actionsToAvoid: [],
        furtherTestingNotes: ''
      },
      section6_prevention: parsedData.section6_prevention || { recommendations: [] },
      section7_expertHelp: parsedData.section7_expertHelp || {
        contactThreshold: 'Contact local agronomist if symptoms spread.',
        recommendedOffices: ['Local Krishi Vigyan Kendra']
      },
      section8_limitations: parsedData.section8_limitations || {
        diagnosticLimitations: ['Visual digital assessment.'],
        unavailableInfo: [],
        disclaimer: 'Advisory guidance only.'
      },
      engineUsed: 'gemini'
    };

    return res.json(report);
  } catch (error: any) {
    console.error('Error during crop analysis:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while analyzing crop.'
    });
  }
});

// Serve frontend in dev or prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 AgriPilot Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

const apiKey = process.env.GEMINI_API_KEY;
const model = 'gemma-4-26b-a4b-it';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

async function runGemma4Forensics() {
  const prompt = `You are the AICTE Chief Scrutiny Advisory Officer for AY 2026-27.
Analyze this technical institution's dossier:
Institution: Lokmanya Tilak College of Engineering (LTCE, APP-2026-9012)
1. Digital tampering: Error Level Analysis (ELA) detected localized whiteout modification in NBA Accreditation Score box (382 vs verified 342).
2. Title Deed: Registered Land Deed SHA-256 byte-stream collision with Sardar Patel Institute of Technology.
3. Laboratory Area: 380 sqm (shortfall against 1.5 sqm/student statutory norm).

Format your statutory advisory evaluation as a JSON object with:
{
  "executiveSummary": "Detailed multi-sentence summary citing AICTE APH 2026-27 norms",
  "overallRiskScore": 0.85,
  "riskLevel": "high",
  "keyFindings": [
    {
      "category": "anomaly",
      "title": "Accreditation Score Digital Alteration & Registry Contradiction",
      "severity": "critical",
      "confidence": 0.88,
      "evidenceText": "ELA compression delta and NBA central registry record contradiction (presented 382 vs official 342)",
      "aphReference": "AICTE APH 2026-27 Chapter I Clause 1.3"
    },
    {
      "category": "anomaly",
      "title": "Cross-Institution Land Deed SHA-256 Collision",
      "severity": "critical",
      "confidence": 0.99,
      "evidenceText": "Identical land deed hash shared with Sardar Patel Institute of Technology",
      "aphReference": "AICTE APH 2026-27 Chapter I Clause 1.4"
    }
  ],
  "statutoryRecommendation": {
    "action": "recommend_physical_inspection",
    "rationale": "High risk of fraudulent metric inflation and duplicate land claim requires on-site EVC inspection.",
    "suggestedConditions": [
      "Depute AICTE Expert Visiting Committee (EVC) for immediate physical land and lab inspection",
      "Issue Show-Cause Notice regarding NBA score discrepancy",
      "Withhold EoA pending EVC verification"
    ]
  }
}
Respond strictly with the JSON object.`;

  console.log('Sending prompt to Gemma 4...');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    })
  });

  const d = await res.json();
  const parts = d.candidates?.[0]?.content?.parts || [];
  console.log(`Received ${parts.length} parts from Gemma 4:`);
  
  // Find part with JSON
  let jsonStr = '';
  for (let i = parts.length - 1; i >= 0; i--) {
    const text = parts[i].text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      jsonStr = match[0];
      break;
    }
  }

  if (jsonStr) {
    const parsed = JSON.parse(jsonStr);
    console.log('--- Successfully Extracted and Parsed Gemma 4 Output ---');
    console.log('Model:', model);
    console.log('Executive Summary:', parsed.executiveSummary);
    console.log('Risk Score:', parsed.overallRiskScore);
    console.log('Risk Level:', parsed.riskLevel);
    console.log('Action:', parsed.statutoryRecommendation.action);
    console.log('Conditions Count:', parsed.statutoryRecommendation.suggestedConditions.length);
  } else {
    console.error('No JSON match found in parts');
  }
}

runGemma4Forensics();

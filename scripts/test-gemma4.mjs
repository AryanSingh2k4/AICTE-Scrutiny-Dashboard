const apiKey = process.env.GEMINI_API_KEY;

async function testGemma4() {
  const model = 'gemma-4-26b-a4b-it';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are the AICTE Chief Scrutiny Advisory Officer for Academic Year 2026-27.
Analyze this document evidence for an institution application:
Institution: Lokmanya Tilak College of Engineering (LTCE, Application: APP-2026-9012)
Document: NBA Accreditation Tier Score Certificate
Evidence:
1. Error Level Analysis (ELA) detected digital tamper whiteout patch in score box (confidence 88%).
2. Stated score is 382/400, but official NBA Central Registry verified score is 342/400.
3. Registered Land Deed has SHA-256 hash collision with Sardar Patel Institute of Technology.
4. Laboratory carpet area is 380 sqm (below the 1.5 sqm/student statutory norm).

Provide an explainable statutory advisory decision under AICTE Approval Process Handbook (APH 2026-27).
Output MUST contain a valid JSON block with these keys:
{
  "executiveSummary": "string summary",
  "overallRiskScore": 0.85,
  "riskLevel": "high",
  "keyFindings": [
    {
      "category": "anomaly",
      "title": "NBA Score Alteration",
      "severity": "critical",
      "confidence": 0.88,
      "evidenceText": "detail",
      "aphReference": "APH 2026-27 Chapter I"
    }
  ],
  "statutoryRecommendation": {
    "action": "recommend_physical_inspection",
    "rationale": "rationale for physical inspection",
    "suggestedConditions": ["condition 1", "condition 2"]
  }
}
Output only the JSON object.`;

  console.log(`Querying Gemma 4 (${model})...`);
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
      }
    })
  });

  const data = await res.json();
  console.log(`Gemma 4 Response received in ${Date.now() - start}ms:`);
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('--- Raw Output snippet ---');
  console.log(rawText?.slice(0, 500));

  // Extract JSON from output
  const jsonMatch = rawText?.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('\n--- Successfully Parsed JSON ---');
    console.log('Executive Summary:', parsed.executiveSummary);
    console.log('Overall Risk Score:', parsed.overallRiskScore);
    console.log('Action:', parsed.statutoryRecommendation?.action);
  } else {
    console.error('No JSON block found in output');
  }
}

testGemma4();

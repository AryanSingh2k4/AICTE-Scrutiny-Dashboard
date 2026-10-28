const apiKey = process.env.GEMINI_API_KEY;
const model = 'gemma-4-26b-a4b-it';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

async function runGemma4Spit() {
  const prompt = `You are the AICTE Chief Scrutiny Advisory Officer for AY 2026-27.
Analyze this technical institution's dossier:
Institution: Sardar Patel Institute of Technology (SPIT, Application: APP-2026-8941)
Evidence:
1. All documents verified: NBA Accreditation certificate verified active until 2027 with matching central registry score.
2. Mandatory Affidavit is contemporaneously notarized and registered.
3. Municipal Fire Safety NOC verified valid.
4. Land ownership deed verified authentic with zero hash collisions.
5. Instructional laboratory carpet area satisfies 1.5 sqm/student norm.
6. Zero ELA image tampering, zero font inconsistencies.

Format your statutory advisory evaluation as a JSON object with:
{
  "executiveSummary": "Multi-sentence summary confirming complete compliance",
  "overallRiskScore": 0.00,
  "riskLevel": "low",
  "keyFindings": [],
  "statutoryRecommendation": {
    "action": "accept",
    "rationale": "All statutory and regulatory norms fully met with verified registry provenance.",
    "suggestedConditions": [
      "Maintain active accreditation",
      "Continuous compliance with mandatory disclosure norms"
    ]
  }
}
Respond strictly with the JSON object.`;

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
    console.log('--- SPIT Clean Application Evaluated by Gemma 4 ---');
    console.log('Executive Summary:', parsed.executiveSummary);
    console.log('Risk Score:', parsed.overallRiskScore);
    console.log('Action:', parsed.statutoryRecommendation.action);
  } else {
    console.error('No JSON found');
  }
}

runGemma4Spit();

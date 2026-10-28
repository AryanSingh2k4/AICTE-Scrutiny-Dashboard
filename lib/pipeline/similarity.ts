// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Cross-Document Text Similarity & Splicing Detector
// Academic Year 2026–27 | Academic & Statutory Plagiarism Detection
// ==============================================================================

/**
 * Normalizes text and extracts word tokens (length >= 3, lowercase alphanumeric).
 */
export function tokenizeText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

/**
 * Generates n-grams from a token array (default 3-grams for phrase-level matching).
 */
export function generateNgrams(tokens: string[], n = 3): Set<string> {
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

export interface SimilarityResult {
  tokenJaccard: number;       // 0.0 to 1.0 (overall vocabulary overlap)
  phraseOverlapRatio: number; // 0.0 to 1.0 (consecutive phrase containment)
  isEditedCopy: boolean;      // True if document appears to be an edited clone
  confidence: number;         // 0.0 to 1.0
  matchedPhrases: string[];
}

/**
 * Computes semantic phrase and token similarity between two document texts.
 * Detects when document B is an edited version of document A.
 */
export function computeDocumentSimilarity(
  textA: string,
  textB: string
): SimilarityResult {
  const tokensA = tokenizeText(textA);
  const tokensB = tokenizeText(textB);

  if (tokensA.length < 10 || tokensB.length < 10) {
    return {
      tokenJaccard: 0,
      phraseOverlapRatio: 0,
      isEditedCopy: false,
      confidence: 0,
      matchedPhrases: [],
    };
  }

  // 1. Vocabulary Jaccard Similarity
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersectionCount = 0;
  for (const t of setA) {
    if (setB.has(t)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  const tokenJaccard = unionCount > 0 ? intersectionCount / unionCount : 0;

  // 2. 3-gram Consecutive Phrase Overlap
  const ngramsA = generateNgrams(tokensA, 3);
  const ngramsB = generateNgrams(tokensB, 3);
  let matchingNgrams = 0;
  const matchedPhrases: string[] = [];

  for (const ng of ngramsB) {
    if (ngramsA.has(ng)) {
      matchingNgrams++;
      if (matchedPhrases.length < 5) {
        matchedPhrases.push(ng);
      }
    }
  }

  // Containment ratio: proportion of B's phrases that exist verbatim in A
  const minNgrams = Math.min(ngramsA.size, ngramsB.size);
  const phraseOverlapRatio = minNgrams > 0 ? matchingNgrams / minNgrams : 0;

  // A document is considered an edited copy if either:
  // - High vocabulary Jaccard (> 0.55) AND high phrase overlap (> 0.40)
  // - Or extremely high phrase overlap (> 0.60)
  const isEditedCopy =
    (tokenJaccard > 0.50 && phraseOverlapRatio > 0.35) ||
    phraseOverlapRatio > 0.55 ||
    tokenJaccard > 0.65;

  const confidence = Number(
    Math.min(0.99, Math.max(phraseOverlapRatio, tokenJaccard) * 1.1).toFixed(2)
  );

  return {
    tokenJaccard: Number(tokenJaccard.toFixed(3)),
    phraseOverlapRatio: Number(phraseOverlapRatio.toFixed(3)),
    isEditedCopy,
    confidence,
    matchedPhrases,
  };
}

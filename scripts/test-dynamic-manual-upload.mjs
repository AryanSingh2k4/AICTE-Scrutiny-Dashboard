import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:3000';

async function uploadFile(collegeId, applicationId, docType, fileName, content) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
  const body = [];
  
  // file field
  body.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: text/plain\r\n\r\n${content}\r\n`);
  // applicationId
  body.push(`--${boundary}\r\nContent-Disposition: form-data; name="applicationId"\r\n\r\n${applicationId}\r\n`);
  // collegeId
  body.push(`--${boundary}\r\nContent-Disposition: form-data; name="collegeId"\r\n\r\n${collegeId}\r\n`);
  // documentType
  body.push(`--${boundary}\r\nContent-Disposition: form-data; name="documentType"\r\n\r\n${docType}\r\n`);
  body.push(`--${boundary}--\r\n`);

  const payload = Buffer.concat(body.map(s => Buffer.from(s, 'utf-8')));

  const res = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: payload,
  });

  return await res.json();
}

async function testScenario() {
  console.log('=================================================================');
  console.log('   TESTING LIVE DYNAMIC UPLOAD & CROSS-COLLEGE EDIT DETECTION   ');
  console.log('=================================================================');

  // Document A for Sardar Patel: Official Land Lease Deed
  const spitLandDeedText = `
GOVERNMENT OF MAHARASHTRA — DEPARTMENT OF REVENUE & LAND RECORDS
REGISTERED INDENTURE OF LEASE AND TITLE CONVEYANCE DEED
DEED REGISTRATION NUMBER: REG/MUM/SUB/2018/88921-A
EXECUTED AT: Andheri Taluka Sub-Registrar Office, Mumbai Suburban District.

THIS REGISTERED TITLE DEED certifies that Bhavan's Sardar Patel Institute of Technology (SPIT),
Munshi Nagar, Andheri West, Mumbai 400058, owns and possesses in absolute title 4.50 acres of
contiguous Institutional Educational Land bearing Survey Plot Numbers CTS-412/A, CTS-412/B,
and CTS-414, Village Andheri, Taluka Andheri.
Statutory demarcations: North bounded by Bhavan's Botanical Enclave, South bounded by Dadabhai Road,
East bounded by Bhavan's Campus Boundary Wall, West bounded by Municipal Service Access Lane.
Total unencumbered land area: 18,210.85 square meters strictly dedicated for AICTE approved
engineering programmes without any commercial sub-leasing or secondary mortgage.
Signed and sealed by Principal & Authorized Trustee on 14th June 2018.
`;

  // Document B for Sardar Patel: Mandatory Affidavit
  const spitAffidavitText = `
BEFORE THE COMPETENT NOTARY PUBLIC — GREATER MUMBAI, MAHARASHTRA
AFFIDAVIT OF STATUTORY COMPLIANCE FOR AICTE EXTENSION OF APPROVAL (AY 2026-27)
I, Dr. B. N. Chaudhari, Principal and Authorized Representative of Sardar Patel Institute of Technology,
do hereby solemnly affirm that all instructional facilities, computer centers, and laboratories satisfy
AICTE Approval Process Handbook (APH 2026-27) norms with 100% genuine documentation.
`;

  console.log('\n[1] Uploading Document 1 to Sardar Patel Institute of Technology (SPIT)...');
  const spitDoc1 = await uploadFile('sardarpatel', 'APP-2026-8941', 'Land Title Deed', 'SPIT_Registered_Land_Deed.txt', spitLandDeedText);
  console.log('  Result:', spitDoc1.success ? 'SUCCESS' : 'FAILED', '| Plagiarism Detected:', spitDoc1.isEditedCopy);

  console.log('\n[2] Uploading Document 2 to Sardar Patel Institute of Technology (SPIT)...');
  const spitDoc2 = await uploadFile('sardarpatel', 'APP-2026-8941', 'Mandatory Affidavit', 'SPIT_Mandatory_Affidavit.txt', spitAffidavitText);
  console.log('  Result:', spitDoc2.success ? 'SUCCESS' : 'FAILED', '| Plagiarism Detected:', spitDoc2.isEditedCopy);

  // Document 3 for LTCE: Special Real Building NOC
  const ltceSpecialDoc = `
MUNICIPAL CORPORATION OF GREATER MUMBAI — BUILDING PROPOSALS DEPARTMENT
OCCUPANCY AND STRUCTURAL FITNESS CLEARANCE CERTIFICATE FOR LTCE KOPARKHAIRANE
Reference: BMC/BP/2026/LTCE-SPEC-77
This certifies that Sector 4, Koparkhairane Campus Building is structurally fit for institutional use.
`;

  console.log('\n[3] Uploading Document 3 (Special Real Document) to Lokmanya Tilak (LTCE)...');
  const ltceDoc3 = await uploadFile('ltce', 'APP-2026-9012', 'Special Building NOC', 'LTCE_Special_Building_NOC.txt', ltceSpecialDoc);
  console.log('  Result:', ltceDoc3.success ? 'SUCCESS' : 'FAILED', '| Plagiarism Detected:', ltceDoc3.isEditedCopy);

  // Document 4 for LTCE: An EDITED VERSION of Sardar Patel's Land Deed!
  // Same survey numbers, same boundaries, same clauses, but institution name replaced!
  const ltceEditedSpitDeed = `
GOVERNMENT OF MAHARASHTRA — DEPARTMENT OF REVENUE & LAND RECORDS
REGISTERED INDENTURE OF LEASE AND TITLE CONVEYANCE DEED
DEED REGISTRATION NUMBER: REG/MUM/SUB/2018/88921-A
EXECUTED AT: Andheri Taluka Sub-Registrar Office, Mumbai Suburban District.

THIS REGISTERED TITLE DEED certifies that Lokmanya Tilak College of Engineering (LTCE),
Navi Mumbai Campus, owns and possesses in absolute title 4.50 acres of
contiguous Institutional Educational Land bearing Survey Plot Numbers CTS-412/A, CTS-412/B,
and CTS-414, Village Andheri, Taluka Andheri.
Statutory demarcations: North bounded by Bhavan's Botanical Enclave, South bounded by Dadabhai Road,
East bounded by Bhavan's Campus Boundary Wall, West bounded by Municipal Service Access Lane.
Total unencumbered land area: 18,210.85 square meters strictly dedicated for AICTE approved
engineering programmes without any commercial sub-leasing or secondary mortgage.
Signed and sealed by Principal on 14th June 2018.
`;

  console.log('\n[4] Uploading Document 4 (EDITED VERSION of SPIT Document) to Lokmanya Tilak (LTCE)...');
  const ltceDoc4 = await uploadFile('ltce', 'APP-2026-9012', 'Land Lease Deed', 'LTCE_Claimed_Land_Deed.txt', ltceEditedSpitDeed);
  
  console.log('\n=================================================================');
  console.log('                 LIVE DETECTION PIPELINE RESULTS                 ');
  console.log('=================================================================');
  console.log('Uploaded File Name:            ', ltceDoc4.fileName);
  console.log('Computed SHA-256 Hash:         ', ltceDoc4.sha256Hash);
  console.log('Exact SHA-256 Duplicate?       ', ltceDoc4.isExactDuplicate ? 'YES' : 'NO (Hashes differ because document was edited)');
  console.log('Cross-College Edited Copy?     ', ltceDoc4.isEditedCopy ? 'CRITICAL PLAGIARISM DETECTED!' : 'NO');
  console.log('Plagiarized From Institution:  ', ltceDoc4.plagiarizedInstitution);
  console.log('Text & Phrase Similarity Score:', `${Math.round(ltceDoc4.similarityScore * 100)}% match`);
  console.log('AICTE Anomaly Flags Generated: ', ltceDoc4.anomalies?.length);
  if (ltceDoc4.anomalies?.length) {
    console.log('Flag Details:                  ', ltceDoc4.anomalies[0].reason);
  }
  console.log('\nGoogle Gemma 4 Decision Support Verdict:');
  console.log('Model Used:                    ', ltceDoc4.aiReport?.modelUsed);
  console.log('Recommended Statutory Action:  ', ltceDoc4.aiReport?.statutoryRecommendation?.action);
  console.log('Risk Score:                    ', ltceDoc4.aiReport?.overallRiskScore);
  console.log('Executive Summary:             ', ltceDoc4.aiReport?.executiveSummary);

  // Now check AICTE officer view endpoint for LTCE
  console.log('\n[5] Querying AICTE Scrutiny Officer Endpoint (/api/applications/APP-2026-9012/documents)...');
  const officerRes = await fetch(`${BASE_URL}/api/applications/APP-2026-9012/documents`);
  const officerData = await officerRes.json();
  console.log(`Officer View Total Documents in Dossier: ${officerData.documents?.length}`);
  console.log(`Officer View Total Flagged Anomalies:   ${officerData.anomalies?.length}`);
  const hasPlagFlag = officerData.anomalies?.some(a => a.anomaly_type === 'cross_institution_plagiarism');
  console.log(`Plagiarism Anomaly Present in Officer Dossier: ${hasPlagFlag ? 'YES (CONFIRMED)' : 'NO'}`);
}

testScenario().catch(console.error);

async function runAudit() {
  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:3000/api/health', method: 'GET' },
    { name: 'Rules API', url: 'http://localhost:3000/api/rules', method: 'GET' },
    { name: 'Decisions GET (SPIT)', url: 'http://localhost:3000/api/decisions?applicationId=APP-2026-8941', method: 'GET' },
    { name: 'Decisions GET (LTCE)', url: 'http://localhost:3000/api/decisions?applicationId=APP-2026-9012', method: 'GET' },
    { name: 'App Documents (SPIT)', url: 'http://localhost:3000/api/applications/APP-2026-8941/documents', method: 'GET' },
    { name: 'App Documents (LTCE)', url: 'http://localhost:3000/api/applications/APP-2026-9012/documents', method: 'GET' },
    { name: 'Audit Verify', url: 'http://localhost:3000/api/audit/verify', method: 'GET' },
    { name: 'Validate App (SPIT)', url: 'http://localhost:3000/api/validate/APP-2026-8941', method: 'POST' },
    { name: 'Validate App (LTCE)', url: 'http://localhost:3000/api/validate/APP-2026-9012', method: 'POST' },
    { name: 'Mock Issuer (NBA)', url: 'http://localhost:3000/api/mock-issuers/nba?id=MAH-ENG-3686', method: 'GET' },
    { name: 'Mock Issuer (Univ)', url: 'http://localhost:3000/api/mock-issuers/university?id=NOC-MAH-2026-9935', method: 'GET' },
    { name: 'Process Doc', url: 'http://localhost:3000/api/process/DOC-APP-2026-8941-NOC', method: 'POST' },
    { name: 'Anomaly Doc', url: 'http://localhost:3000/api/anomaly/DOC-APP-2026-9012-NOC', method: 'GET' },
  ];

  console.log('========================================================================');
  console.log('               SCRUTINIX COMPREHENSIVE END-TO-END AUDIT                 ');
  console.log('========================================================================\n');

  const results = [];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { method: ep.method });
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = await res.text();
      }
      const isOk = res.status >= 200 && res.status < 300;
      console.log(`${ep.name.padEnd(25)}: [${isOk ? 'PASS' : 'FAIL'}] Status ${res.status} (${res.statusText})`);
      results.push({ ...ep, status: res.status, ok: isOk, body });
    } catch (e) {
      console.log(`${ep.name.padEnd(25)}: [ERROR] ${e.message}`);
      results.push({ ...ep, status: 0, ok: false, error: e.message });
    }
  }

  return results;
}

runAudit();

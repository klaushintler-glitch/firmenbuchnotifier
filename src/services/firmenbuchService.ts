import { XMLParser } from 'fast-xml-parser';

export interface Company {
  fnr: string;
  name: string;
  sitz?: string;
  rechtsform?: {
    code: string;
    text: string;
  };
  status?: string;
  gericht?: string;
}

export interface DocumentInfo {
  key: string;
  fnr: string;
  az: string;
  dokumentart: string;
  groesse: number;
  eingereicht: string;
  stichtag?: string;
}

export interface DocumentDownload {
  key: string;
  contentType: string;
  extension: string;
  filename: string;
  content: string; // Base64 content
}

// Test/Mock overrides for unit tests
export const mockOverrides = {
  getCompanyDocuments: null as null | ((fnr: string) => Promise<DocumentInfo[]>),
  searchCompany: null as null | ((wortlaut: string, exact?: boolean) => Promise<Company[]>),
  downloadDocument: null as null | ((key: string) => Promise<DocumentDownload>)
};

// Check if we should run in Mock/Demo mode
export function isMockMode(): boolean {
  const key = process.env.FIRMENBUCH_API_KEY;
  return !key || key.trim() === '' || key.trim() === 'your_key_here' || key.trim() === 'dummy_key';
}

// Helper to identify mock company FNRs
export function isMockFnr(fnr: string): boolean {
  const clean = (fnr || '').toLowerCase().trim().replace(/\s+/g, '');
  return ['123456a', '234567b', '345678c', '456789d', '567890e', '678901f'].includes(clean);
}

// Helper to identify mock document keys
export function isMockDocKey(key: string): boolean {
  const clean = (key || '').toLowerCase().trim();
  return ['123456a', '234567b', '345678c', '456789d', '567890e', '678901f'].some(fnr => clean.startsWith(fnr));
}

// Helper to generate mock document download payload
function getMockDocumentDownload(key: string): DocumentDownload {
  let docName = "Dokument.pdf";
  if (key.includes("jahresabschluss")) docName = "Jahresabschluss_2024.pdf";
  
  const mockPdfBase64 = "JVBERi0xLjQKMSAwIG9iagogIDw8L1R5cGUvQ2F0YWxvZwogICAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iagogIDw8L1R5cGUvUGFnZXMKICAgL0tpZHNbMyAwIFJdCiAgIC9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKICA8PC9UeXBlL1BhZ2UKICAgL1BhcmVudCAyIDAgUgogICAvTWVkaWFCb3hbMCAwIDU5NSA4NDJdCiAgIC9Db3VudGVudHMgNCAwIFI+PgplbmRvYmoKNCAwIG9iagogIDw8L0xlbmd0aCA2Mj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKIDcyIDcxMiBUZAogKE1vY2sgRmlybWVuYnVjaCBEb2N1bWVudDog" + key + ") TjETCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IAAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbiAKMDAwMDAwMDExMyAwMDAwMCBuIAowMDAwMDAwMjEwIDAwMDAwIG4gCnRyYWlsZXIKICA8PC9TaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgowCiUlRU9GCg==";

  return {
    key: key,
    contentType: "application/pdf",
    extension: "pdf",
    filename: docName,
    content: mockPdfBase64
  };
}

// Helper: Extract code and text from legal form string
function mapRechtsform(str: string) {
  const clean = (str || '').trim();
  let code = 'Firma';
  if (/gmbh|gesellschaft\s+mit\s+beschr/i.test(clean)) code = 'GmbH';
  else if (/aktiengesellschaft|ag/i.test(clean)) code = 'AG';
  else if (/offene\s+gesellschaft|og/i.test(clean)) code = 'OG';
  else if (/kommanditgesellschaft|kg/i.test(clean)) code = 'KG';
  else if (/eingetragener\s+unternehmer|e\.u\./i.test(clean)) code = 'e.U.';
  
  return {
    code: code,
    text: clean
  };
}

/**
 * Generate hardcoded mock companies as a safety fallback
 */
function getMockCompaniesFallback(query: string): Company[] {
  const q = (query || '').toLowerCase().trim();
  const allMocks: Company[] = [
    { fnr: "123456a", name: "Mayer Bau GmbH", sitz: "Wien", rechtsform: { code: "GmbH", text: "Gesellschaft mit beschränkter Haftung" }, status: "aktiv", gericht: "Handelsgericht Wien" },
    { fnr: "234567b", name: "Elektro Mayer OEG", sitz: "Graz", rechtsform: { code: "OG", text: "Offene Gesellschaft" }, status: "aktiv", gericht: "Landesgericht für ZRS Graz" },
    { fnr: "345678c", name: "Mayer & Partner KG", sitz: "Linz", rechtsform: { code: "KG", text: "Kommanditgesellschaft" }, status: "gelöscht", gericht: "Landesgericht Linz" },
    { fnr: "456789d", name: "Alpine Tech GmbH", sitz: "Innsbruck", rechtsform: { code: "GmbH", text: "Gesellschaft mit beschränkter Haftung" }, status: "aktiv", gericht: "Landesgericht Innsbruck" },
    { fnr: "567890e", name: "Vienna CyberTech OG", sitz: "Wien", rechtsform: { code: "OG", text: "Offene Gesellschaft" }, status: "aktiv", gericht: "Handelsgericht Wien" },
    { fnr: "678901f", name: "DeepMind Austria GmbH", sitz: "Salzburg", rechtsform: { code: "GmbH", text: "Gesellschaft mit beschränkter Haftung" }, status: "aktiv", gericht: "Landesgericht Salzburg" }
  ];

  if (!q) return allMocks;
  return allMocks.filter(c => c.name.toLowerCase().includes(q) || c.fnr.toLowerCase().includes(q));
}

/**
 * Generate mock documents for a given FNR (fallback/tests)
 */
function getMockDocuments(fnr: string): DocumentInfo[] {
  const cleanFnr = (fnr || '').trim();
  return [
    {
      key: `${cleanFnr}_doc_1_jahresabschluss_2024`,
      fnr: cleanFnr,
      az: "001 Fr 100/24",
      dokumentart: "Jahresabschluss",
      groesse: 24531,
      eingereicht: "2025-05-15",
      stichtag: "2024-12-31"
    },
    {
      key: `${cleanFnr}_doc_2_gesellschafterbeschluss_2023`,
      fnr: cleanFnr,
      az: "001 Fr 80/23",
      dokumentart: "Gesellschafterbeschluss",
      groesse: 12054,
      eingereicht: "2023-11-20"
    },
    {
      key: `${cleanFnr}_doc_3_gesellschaftsvertrag`,
      fnr: cleanFnr,
      az: "001 Fr 10/20",
      dokumentart: "Gesellschaftsvertrag",
      groesse: 184090,
      eingereicht: "2020-04-05"
    }
  ];
}

// Helpers for SOAP and XML processing
function stripXmlNamespaces(xml: string): string {
  return xml.replace(/<\/?([a-zA-Z0-9_\-\.]+):/g, (match) => {
    return match.startsWith('</') ? '</' : '<';
  });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

async function soapRequest(requestXml: string): Promise<string> {
  const url = 'https://justizonline.gv.at/jop/api/at.gv.justiz.fbw/ws';
  const apiKey = process.env.FIRMENBUCH_API_KEY || '';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml;charset=UTF-8',
      'X-API-KEY': apiKey
    },
    body: requestXml
  });

  const text = await response.text();

  if (!response.ok) {
    let faultReason = `Justiz API responded with status ${response.status}: ${response.statusText}`;
    try {
      const cleanText = stripXmlNamespaces(text);
      const parser = new XMLParser({ ignoreAttributes: true });
      const json = parser.parse(cleanText);
      const reasonText = json?.Envelope?.Body?.Fault?.Reason?.Text;
      if (reasonText) {
        faultReason = typeof reasonText === 'object' ? (reasonText['#text'] || JSON.stringify(reasonText)) : reasonText;
      }
    } catch (_) {}
    throw new Error(faultReason);
  }

  return text;
}

/**
 * REST/SOAP API: Search for a company
 */
export async function searchCompany(wortlaut: string, exact = false): Promise<Company[]> {
  if (mockOverrides.searchCompany) {
    return mockOverrides.searchCompany(wortlaut, exact);
  }

  // If FNR is a mock FNR, return the mock company immediately
  if (isMockFnr(wortlaut)) {
    return getMockCompaniesFallback(wortlaut);
  }

  if (isMockMode()) {
    console.log(`[Justiz API] Mock mode: returning fallbacks for: "${wortlaut}"`);
    return getMockCompaniesFallback(wortlaut);
  }

  try {
    const requestXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:suc="ns://firmenbuch.justiz.gv.at/Abfrage/SucheFirmaRequest">
  <soap:Header/>
  <soap:Body>
    <suc:SUCHEFIRMAREQUEST>
      <suc:FIRMENWORTLAUT>${escapeXml(wortlaut)}</suc:FIRMENWORTLAUT>
      <suc:EXAKTESUCHE>${exact}</suc:EXAKTESUCHE>
      <suc:SUCHBEREICH>1</suc:SUCHBEREICH>
      <suc:GERICHT></suc:GERICHT>
      <suc:RECHTSFORM></suc:RECHTSFORM>
      <suc:RECHTSEIGENSCHAFT></suc:RECHTSEIGENSCHAFT>
      <suc:ORTNR></suc:ORTNR>
    </suc:SUCHEFIRMAREQUEST>
  </soap:Body>
</soap:Envelope>`;

    const responseText = await soapRequest(requestXml);
    const cleanXml = stripXmlNamespaces(responseText);
    const parser = new XMLParser({ ignoreAttributes: true });
    const jsonObj = parser.parse(cleanXml);

    const responseBody = jsonObj?.Envelope?.Body?.SUCHEFIRMARESPONSE;
    if (!responseBody) return [];

    const ergebnis = responseBody.ERGEBNIS;
    if (!ergebnis) return [];

    const items = Array.isArray(ergebnis) ? ergebnis : [ergebnis];
    return items.map((item: any) => {
      const nameRaw = item.NAME;
      const name = Array.isArray(nameRaw) ? nameRaw.join(' ') : (nameRaw || '');
      const statusRaw = (item.STATUS || '').trim().toLowerCase();
      const status = statusRaw === 'gelöscht' ? 'gelöscht' : 'aktiv';
      
      return {
        fnr: item.FNR,
        name: name,
        sitz: item.SITZ || 'Österreich',
        status: status,
        gericht: item.GERICHT?.TEXT || '',
        rechtsform: {
          code: item.RECHTSFORM?.CODE || 'Firma',
          text: item.RECHTSFORM?.TEXT || 'Firmenbuch-Eintrag'
        }
      };
    });
  } catch (error) {
    console.error("[Justiz API] Search error:", error);
    throw error;
  }
}

/**
 * REST/SOAP API: List documents for a given FNR
 */
export async function getCompanyDocuments(fnr: string): Promise<DocumentInfo[]> {
  if (mockOverrides.getCompanyDocuments) {
    return mockOverrides.getCompanyDocuments(fnr);
  }

  // If FNR is a mock FNR, return mock documents immediately
  if (isMockFnr(fnr)) {
    return getMockDocuments(fnr);
  }

  if (isMockMode()) {
    console.log(`[Justiz API] Mock mode: returning mock documents for: "${fnr}"`);
    return getMockDocuments(fnr);
  }

  try {
    const requestXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:suc="ns://firmenbuch.justiz.gv.at/Abfrage/SucheUrkundeRequest">
  <soap:Header/>
  <soap:Body>
    <suc:SUCHEURKUNDEREQUEST>
      <suc:FNR>${escapeXml(fnr)}</suc:FNR>
    </suc:SUCHEURKUNDEREQUEST>
  </soap:Body>
</soap:Envelope>`;

    const responseText = await soapRequest(requestXml);
    const cleanXml = stripXmlNamespaces(responseText);
    const parser = new XMLParser({ ignoreAttributes: true });
    const jsonObj = parser.parse(cleanXml);

    const responseBody = jsonObj?.Envelope?.Body?.SUCHEURKUNDERESPONSE;
    if (!responseBody) return [];

    const ergebnis = responseBody.ERGEBNIS;
    if (!ergebnis) return [];

    const items = Array.isArray(ergebnis) ? ergebnis : [ergebnis];
    const mapped = items.map((item: any) => ({
      key: item.KEY,
      fnr: item.FNR,
      az: item.AZ,
      dokumentart: item.DOKUMENTART?.TEXT || item.DOKUMENTART?.CODE || 'Dokument',
      groesse: Number(item.GROESSE) || 0,
      eingereicht: item.EINGEREICHT || '',
      stichtag: item.STICHTAG || ''
    }));

    // Sort by submission date (eingereicht) descending (newest first)
    mapped.sort((a, b) => {
      const dateA = a.eingereicht || '';
      const dateB = b.eingereicht || '';
      return dateB.localeCompare(dateA);
    });

    return mapped;
  } catch (error) {
    console.error("[Justiz API] Get documents error:", error);
    throw error;
  }
}

/**
 * REST/SOAP API: Download a document and return metadata & base64 content
 */
export async function downloadDocument(key: string): Promise<DocumentDownload> {
  if (mockOverrides.downloadDocument) {
    return mockOverrides.downloadDocument(key);
  }

  // If document key is a mock key, download mock file immediately
  if (isMockDocKey(key)) {
    return getMockDocumentDownload(key);
  }

  if (isMockMode()) {
    console.log(`[Justiz API] Mock mode: downloading mock file for: "${key}"`);
    return getMockDocumentDownload(key);
  }

  try {
    const requestXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:urk="ns://firmenbuch.justiz.gv.at/Abfrage/UrkundeRequest">
  <soap:Header/>
  <soap:Body>
    <urk:URKUNDEREQUEST>
      <urk:KEY>${escapeXml(key)}</urk:KEY>
    </urk:URKUNDEREQUEST>
  </soap:Body>
</soap:Envelope>`;

    const responseText = await soapRequest(requestXml);
    const cleanXml = stripXmlNamespaces(responseText);
    const parser = new XMLParser({ ignoreAttributes: true });
    const jsonObj = parser.parse(cleanXml);

    const responseBody = jsonObj?.Envelope?.Body?.URKUNDERESPONSE;
    if (!responseBody) {
      throw new Error('Document download payload empty or invalid');
    }

    const metadaten = responseBody.METADATEN;
    const dokument = responseBody.DOKUMENT;

    if (!dokument) {
      throw new Error('Document data section is missing');
    }

    const docType = metadaten?.DOKUMENTART?.TEXT || 'Dokument';
    const ext = dokument.DATEIENDUNG || 'pdf';
    const cleanFnr = metadaten?.FNR || 'fb';
    const filename = `${docType.replace(/[^a-zA-Z0-9]/g, '_')}_${cleanFnr.trim()}.${ext}`;

    return {
      key: key,
      contentType: dokument.CONTENTTYPE || "application/pdf",
      extension: ext,
      filename: filename,
      content: dokument.CONTENT || ""
    };
  } catch (error) {
    console.error("[Justiz API] Download document error:", error);
    throw error;
  }
}

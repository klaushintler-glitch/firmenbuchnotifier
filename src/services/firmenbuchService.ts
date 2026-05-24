export interface Company {
  fnr: string;
  name: string;
  sitz: string;
  rechtsform: {
    code: string;
    text: string;
  };
}

export interface DocumentInfo {
  key: string;
  fnr: string;
  az: string;
  dokumentart: string;
  groesse: number;
  eingereicht: string;
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
    { fnr: "123456a", name: "Mayer Bau GmbH", sitz: "Wien", rechtsform: { code: "GmbH", text: "Gesellschaft mit beschränkter Haftung" } },
    { fnr: "234567b", name: "Elektro Mayer OEG", sitz: "Graz", rechtsform: { code: "OG", text: "Offene Gesellschaft" } },
    { fnr: "345678c", name: "Mayer & Partner KG", sitz: "Linz", rechtsform: { code: "KG", text: "Kommanditgesellschaft" } },
    { fnr: "456789d", name: "Alpine Tech GmbH", sitz: "Innsbruck", rechtsform: { code: "GmbH", text: "Gesellschaft mit beschränkter Haftung" } },
    { fnr: "567890e", name: "Vienna CyberTech OG", sitz: "Wien", rechtsform: { code: "OG", text: "Offene Gesellschaft" } },
    { fnr: "678901f", name: "DeepMind Austria GmbH", sitz: "Salzburg", rechtsform: { code: "GmbH", text: "Gesellschaft mit beschränkter Haftung" } }
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
      eingereicht: "2025-05-15"
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

/**
 * REST API: Search for a company
 */
export async function searchCompany(wortlaut: string, exact = false): Promise<Company[]> {
  if (mockOverrides.searchCompany) {
    return mockOverrides.searchCompany(wortlaut, exact);
  }

  // 1. If mock mode, try querying the public, no-key endpoint of firmafind.at first!
  // If it fails (due to rate limits), fall back to hardcoded mock data.
  if (isMockMode()) {
    console.log(`[FirmaFind API] Mock mode: attempting public search for: "${wortlaut}"`);
    try {
      const response = await fetch(`https://firmafind.at/api/companies/public?q=${encodeURIComponent(wortlaut)}`);
      if (response.ok) {
        const json = await response.json();
        const raw = json.data || [];
        return raw.map((item: any) => ({
          fnr: item.fnr,
          name: item.name,
          sitz: item.sitz || item.city || '',
          rechtsform: mapRechtsform(item.rechtsform || '')
        }));
      }
    } catch (e) {
      console.warn("[FirmaFind API] Public search failed. Falling back to hardcoded mock data:", e);
    }
    return getMockCompaniesFallback(wortlaut);
  }

  // 2. Authenticated search
  try {
    const url = `https://firmafind.at/api/companies?name=${encodeURIComponent(wortlaut)}`;
    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.FIRMENBUCH_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`FirmaFind API responded with status ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const raw = json.data || [];
    return raw.map((item: any) => ({
      fnr: item.fnr,
      name: item.name,
      sitz: item.sitz || item.city || item.address?.seat || '',
      rechtsform: mapRechtsform(item.rechtsform || '')
    }));
  } catch (error) {
    console.error("[FirmaFind API] Search error:", error);
    throw error;
  }
}

/**
 * REST API: List documents for a given FNR
 */
export async function getCompanyDocuments(fnr: string): Promise<DocumentInfo[]> {
  if (mockOverrides.getCompanyDocuments) {
    return mockOverrides.getCompanyDocuments(fnr);
  }

  if (isMockMode()) {
    console.log(`[FirmaFind API] Mock mode: returning mock documents for: "${fnr}"`);
    return getMockDocuments(fnr);
  }

  try {
    // Clean FNR of spaces for FirmaFind API query
    const cleanFnr = fnr.replace(/\s+/g, '');
    const url = `https://firmafind.at/api/documents?fnr=${encodeURIComponent(cleanFnr)}`;
    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.FIRMENBUCH_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`FirmaFind API responded with status ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const raw = json.data || [];
    const mapped = raw.map((item: any) => ({
      key: item.key,
      fnr: item.fnr,
      az: item.az,
      dokumentart: item.dokumentart?.text || item.dokumentart?.code || 'Dokument',
      groesse: item.groesse || 0,
      eingereicht: item.eingereicht || ''
    }));

    // Sort by submission date (eingereicht) descending (newest first)
    mapped.sort((a: DocumentInfo, b: DocumentInfo) => {
      const dateA = a.eingereicht || '';
      const dateB = b.eingereicht || '';
      return dateB.localeCompare(dateA);
    });

    return mapped;
  } catch (error) {
    console.error("[FirmaFind API] Get documents error:", error);
    throw error;
  }
}

/**
 * REST API: Download a document and return metadata & base64 content
 */
export async function downloadDocument(key: string): Promise<DocumentDownload> {
  if (mockOverrides.downloadDocument) {
    return mockOverrides.downloadDocument(key);
  }

  if (isMockMode()) {
    console.log(`[FirmaFind API] Mock mode: downloading mock file for: "${key}"`);
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

  try {
    const url = `https://firmafind.at/api/documents/${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.FIRMENBUCH_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`FirmaFind API responded with status ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const payload = json.data;
    if (!payload) {
      throw new Error(`Document data for key ${key} not found.`);
    }

    const metadaten = payload.metadaten;
    const dokument = payload.dokument;

    const docType = metadaten?.dokumentart?.text || 'Dokument';
    const ext = dokument?.dateiendung || 'pdf';
    const cleanFnr = metadaten?.fnr || 'fb';
    const filename = `${docType.replace(/[^a-zA-Z0-9]/g, '_')}_${cleanFnr.trim()}.${ext}`;

    return {
      key: key,
      contentType: dokument?.contentType || "application/pdf",
      extension: ext,
      filename: filename,
      content: dokument?.content || ""
    };
  } catch (error) {
    console.error("[FirmaFind API] Download document error:", error);
    throw error;
  }
}

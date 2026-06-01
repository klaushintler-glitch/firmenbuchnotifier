import assert from 'assert';
// Force Mock/Demo mode for unit tests
process.env.FIRMENBUCH_API_KEY = '';
import { searchCompany, getCompanyDocuments, downloadDocument, isMockMode } from '../services/firmenbuchService';
import { XMLParser } from 'fast-xml-parser';

const sampleSearchSoapResponse = `
<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="ns://something">
  <env:Header/>
  <env:Body>
    <ns:SUCHEFIRMARESPONSE>
      <ns:ERGEBNIS>
        <ns:FNR>123456p</ns:FNR>
        <ns:NAME>Test Company GmbH</ns:NAME>
        <ns:SITZ>Wien</ns:SITZ>
        <ns:RECHTSFORM>
          <ns:CODE>GmbH</ns:CODE>
          <ns:TEXT>Gesellschaft mit beschränkter Haftung</ns:TEXT>
        </ns:RECHTSFORM>
      </ns:ERGEBNIS>
    </ns:SUCHEFIRMARESPONSE>
  </env:Body>
</env:Envelope>
`;

function testXmlStripping() {
  console.log("Running XML Namespace Stripping Test...");
  
  function stripNamespaces(xml: string): string {
    return xml.replace(/<\/?([a-zA-Z0-9_\-\.]+):/g, (match) => {
      return match.startsWith('</') ? '</' : '<';
    });
  }
  
  const cleanXml = stripNamespaces(sampleSearchSoapResponse);
  const parser = new XMLParser({ ignoreAttributes: true });
  const jsonObj = parser.parse(cleanXml);
  
  const item = jsonObj?.Envelope?.Body?.SUCHEFIRMARESPONSE?.ERGEBNIS;
  
  assert.strictEqual(item?.FNR, "123456p");
  assert.strictEqual(item?.NAME, "Test Company GmbH");
  assert.strictEqual(item?.SITZ, "Wien");
  assert.strictEqual(item?.RECHTSFORM?.CODE, "GmbH");
  assert.strictEqual(item?.RECHTSFORM?.TEXT, "Gesellschaft mit beschränkter Haftung");
  
  console.log("✔ XML Namespace Stripping Test passed!");
}

async function testMockService() {
  console.log("Running Mock Service Integration Tests...");
  
  assert.strictEqual(isMockMode(), true, "Service must run in Mock Mode for testing");
  
  const results = await searchCompany("mayer");
  console.log(`Found ${results.length} companies matching "mayer".`);
  assert(results.length > 0, "Should return mock companies");
  assert(results.some(c => c.name.includes("Mayer")), "Results should include 'Mayer' in their names");
  
  const docs = await getCompanyDocuments("123456a");
  console.log(`Found ${docs.length} documents for company '123456a'.`);
  assert.strictEqual(docs.length, 3, "Mock mode should return 3 documents");
  assert.strictEqual(docs[0].fnr, "123456a", "Fnr should match query");
  assert(docs[0].key.includes("jahresabschluss"), "First document should be jahresabschluss");
  
  const docDownload = await downloadDocument(docs[0].key);
  console.log(`Downloaded document name: "${docDownload.filename}" with length ${docDownload.content.length} (base64).`);
  assert.strictEqual(docDownload.key, docs[0].key, "Downloaded key should match request");
  assert.strictEqual(docDownload.contentType, "application/pdf", "Mock document should be a PDF");
  assert(docDownload.content.length > 100, "Base64 content should not be empty");
  
  console.log("✔ Mock Service Integration Tests passed!");
}

async function runTests() {
  try {
    testXmlStripping();
    await testMockService();
    console.log("\nAll API Client Tests Passed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
  }
}

runTests();

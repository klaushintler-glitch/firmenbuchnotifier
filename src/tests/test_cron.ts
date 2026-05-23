import assert from 'assert';
import { runCronCheck } from '../bin/cron-check';
import { supabaseAdmin } from '../services/supabaseClient';
import { mockOverrides } from '../services/firmenbuchService';

// We will temporarily mock the supabaseAdmin and firmenbuchService to test the cron-check behavior
async function testCronCheckFlow() {
  console.log("Starting test for Cron Notification flow...");

  // Save original methods
  const originalFrom = supabaseAdmin.from;

  let insertCalled = false;
  let insertedDocs: any[] = [];
  let emailSentCount = 0;

  // Mock Supabase Database calls
  supabaseAdmin.from = (table: string): any => {
    return {
      select: (columns?: string, options?: any): any => {
        return {
          in: (col: string, values: any[]): any => {
            if (table === 'tracked_documents') {
              // Return mock tracked documents (say, we already track doc 1 and 2, but NOT doc 3)
              return {
                data: [
                  { document_key: '123456a_doc_1_jahresabschluss_2024' },
                  { document_key: '123456a_doc_2_gesellschafterbeschluss_2023' }
                ],
                error: null
              };
            }
            if (table === 'profiles') {
              // Return mock user profiles
              return {
                data: [
                  { id: 'user_1', email: 'klaus@test.com' }
                ],
                error: null
              };
            }
            return { data: null, error: new Error('Not implemented in mock') };
          },
          eq: (col: string, val: any): any => {
            if (table === 'favorites') {
              // Return profiles tracking FNR
              return {
                data: [
                  { id: 'user_1', email: 'klaus@test.com' }
                ],
                error: null
              };
            }
            return { data: null, error: new Error('Not implemented in mock') };
          }
        };
      },
      insert: (values: any[]): any => {
        if (table === 'tracked_documents') {
          insertCalled = true;
          insertedDocs = values;
          return { error: null };
        }
        return { error: new Error('Not implemented in mock') };
      }
    };
  };

  // Mock Supabase from('favorites').select('fnr, company_name, user_id')
  // We override favorites select response by wrapping it
  const oldFrom = supabaseAdmin.from;
  supabaseAdmin.from = (table: string): any => {
    if (table === 'favorites') {
      return {
        select: (columns: string) => {
          if (columns === 'company_fn, company_name, user_id') {
            return {
              data: [
                { company_fn: '123456a', company_name: 'Mayer Bau GmbH', user_id: 'user_1' }
              ],
              error: null
            };
          }
          // fallback to user_id, company_name query
          return {
            eq: (col: string, val: any) => {
              return {
                data: [
                  { user_id: 'user_1', company_name: 'Mayer Bau GmbH' }
                ],
                error: null
              };
            }
          };
        }
      };
    }
    if (table === 'profiles') {
      return {
        select: (columns: string) => {
          return {
            in: (col: string, vals: any[]) => {
              return {
                data: [
                  { id: 'user_1', email: 'klaus@test.com' }
                ],
                error: null
              };
            }
          };
        }
      };
    }
    return oldFrom(table);
  };

  // Mock getCompanyDocuments
  // Returns docs 1, 2, AND 3. Since DB only knows 1 and 2, doc 3 should be detected as new!
  mockOverrides.getCompanyDocuments = async (fnr: string): Promise<any[]> => {
    return [
      {
        key: '123456a_doc_1_jahresabschluss_2024',
        fnr: '123456a',
        az: '001 Fr 100/24',
        dokumentart: 'Jahresabschluss',
        groesse: 24531,
        eingereicht: '2025-05-15'
      },
      {
        key: '123456a_doc_2_gesellschafterbeschluss_2023',
        fnr: '123456a',
        az: '001 Fr 80/23',
        dokumentart: 'Gesellschafterbeschluss',
        groesse: 12054,
        eingereicht: '2023-11-20'
      },
      {
        key: '123456a_doc_3_gesellschaftsvertrag',
        fnr: '123456a',
        az: '001 Fr 10/20',
        dokumentart: 'Gesellschaftsvertrag',
        groesse: 184090,
        eingereicht: '2020-04-05'
      }
    ];
  };

  try {
    // Run cron check with mocked DB and API
    await runCronCheck();

    // Assert that we inserted doc 3 to tracked_documents
    assert.strictEqual(insertCalled, true, "Should insert newly detected documents to DB");
    assert.strictEqual(insertedDocs.length, 1, "Should insert exactly 1 new document");
    assert.strictEqual(insertedDocs[0].document_key, '123456a_doc_3_gesellschaftsvertrag');

    console.log("✔ Cron update detection logic verified successfully!");
  } finally {
    // Restore original methods
    supabaseAdmin.from = originalFrom;
    mockOverrides.getCompanyDocuments = null;
  }
}

async function runTests() {
  try {
    await testCronCheckFlow();
    console.log("\nAll Cron Worker Tests Passed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cron Worker Test execution failed:", error);
    process.exit(1);
  }
}

runTests();

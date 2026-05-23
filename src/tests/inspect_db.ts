import { supabaseAdmin } from '../services/supabaseClient';

async function inspectDb() {
  console.log("=== Inspecting Database Schema ===");
  try {
    // We can query a dummy row or fetch the table description to see what columns exist.
    // An easy way is to run a select with a limit of 1 and print the keys of the returned object (if any),
    // or try inserting a dummy row to see what schema violations or columns are reported,
    // or inspect columns via postgrest.
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select('*')
      .limit(1);

    if (error) {
      console.error("Query Error:", error);
    } else {
      console.log("Favorites table query result:", data);
      if (data && data.length > 0) {
        console.log("Columns in favorites table:", Object.keys(data[0]));
      } else {
        // Table is empty. Let's try fetching the columns by executing a query that forces a column name list,
        // or check metadata. In PostgREST, we can get the schema definition:
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
        if (response.ok) {
          const schema = await response.json();
          const favoritesSchema = schema.definitions?.favorites;
          if (favoritesSchema) {
            console.log("Favorites schema columns:", Object.keys(favoritesSchema.properties));
          } else {
            console.log("Favorites table not found in OpenAPI definitions.");
          }
        } else {
          console.log("Failed to fetch database schema definitions from PostgREST API.");
        }
      }
    }
  } catch (err) {
    console.error("Inspection Error:", err);
  }
}

inspectDb();

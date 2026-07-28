const initSqlJs = require('sql.js');
const fs = require('fs');

(async () => {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync('out.db');
  const db = new SQL.Database(buffer);

  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables found:', tables[0]?.values.flat() || 'none');

  for (const table of ['source_documents', 'canonical_statements']) {
    const result = db.exec(`SELECT count(*) as cnt FROM ${table}`);
    if (result.length && result[0].values.length) {
      console.log(`${table}: ${result[0].values[0][0]} rows`);
    } else {
      console.log(`${table}: no data or table doesn't exist`);
    }
  }
})();
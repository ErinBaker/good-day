const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../dev.db'); // Adjust if your DB path is different
const db = new sqlite3.Database(dbPath);

function isUnixTimestamp(val) {
  // Accepts ms timestamps from 2000-01-01 to 2100-01-01
  return typeof val === 'number' && val > 946684800000 && val < 4102444800000;
}

function toISO(val) {
  if (isUnixTimestamp(val)) {
    return new Date(val).toISOString();
  }
  return val;
}

function migrateTable(table, fields, idField = 'id') {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
      if (err) return reject(err);
      let updates = 0;
      rows.forEach(row => {
        let needsUpdate = false;
        const updatesObj = {};
        fields.forEach(field => {
          if (isUnixTimestamp(row[field])) {
            updatesObj[field] = toISO(row[field]);
            needsUpdate = true;
          }
        });
        if (needsUpdate) {
          const setClause = Object.keys(updatesObj).map(f => `${f} = ?`).join(', ');
          const values = Object.values(updatesObj);
          values.push(row[idField]);
          db.run(`UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`, values, err2 => {
            if (err2) console.error(`Failed to update ${table} row ${row[idField]}:`, err2);
          });
          updates++;
        }
      });
      console.log(`${table}: Updated ${updates} rows.`);
      resolve();
    });
  });
}

async function main() {
  try {
    await migrateTable('Memory', ['date', 'createdAt', 'updatedAt']);
    await migrateTable('Person', ['createdAt', 'updatedAt']);
    await migrateTable('Photo', ['createdAt']);
    console.log('Migration complete!');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    db.close();
  }
}

main(); 
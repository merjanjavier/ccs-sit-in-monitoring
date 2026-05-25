/**
 * SQLite to Turso Migration Script
 * 
 * This script migrates the schema, indexes, and all row data from a local SQLite 
 * database file (ccs_database.db) to your cloud-hosted Turso database.
 */

const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const localDbPath = path.join(__dirname, 'ccs_database.db');
const remoteUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

async function migrate() {
  console.log('=== Turso DB Migration Script ===');
  
  // Validate local file
  if (!fs.existsSync(localDbPath)) {
    console.error(`Error: Local SQLite file not found at ${localDbPath}`);
    console.error('Please make sure you have the ccs_database.db in your project root.');
    process.exit(1);
  }

  // Validate remote credentials
  if (!remoteUrl || remoteUrl.startsWith('file:')) {
    console.error('Error: Remote TURSO_DATABASE_URL is not configured.');
    console.error('Please configure your Turso Database URL and Auth Token in your .env file:');
    console.error('  TURSO_DATABASE_URL=libsql://your-db-name.turso.io');
    console.error('  TURSO_AUTH_TOKEN=your_auth_token');
    process.exit(1);
  }

  console.log(`Connecting to Local DB: file:${localDbPath}`);
  const localClient = createClient({ url: 'file:ccs_database.db' });

  console.log(`Connecting to Remote DB: ${remoteUrl}`);
  const remoteClient = createClient({ url: remoteUrl, authToken });

  try {
    // 1. Fetch tables list and schema
    console.log('\nStep 1: Reading tables from local database...');
    const tablesResult = await localClient.execute(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    const tables = tablesResult.rows;
    console.log(`Found ${tables.length} tables to migrate.`);

    // 2. Recreate schemas on Remote DB
    console.log('\nStep 2: Re-creating schemas on remote database...');
    for (const table of tables) {
      const tableName = table.name;
      let createSql = table.sql;
      
      // Inject "IF NOT EXISTS" if it isn't already there to prevent crash
      if (!createSql.toUpperCase().includes('IF NOT EXISTS')) {
        createSql = createSql.replace(/CREATE TABLE (\w+)/i, 'CREATE TABLE IF NOT EXISTS $1');
      }

      console.log(`- Creating table structure: "${tableName}"...`);
      await remoteClient.execute(createSql);
    }
    console.log('Schemas created successfully.');

    // 3. Migrate rows from each table
    console.log('\nStep 3: Transferring row data...');
    for (const table of tables) {
      const tableName = table.name;
      console.log(`\nProcessing table: "${tableName}"...`);

      // Read rows from local database
      const rowsResult = await localClient.execute(`SELECT * FROM ${tableName}`);
      const rows = rowsResult.rows;

      if (rows.length === 0) {
        console.log(`  - No rows found. Skipping data transfer.`);
        continue;
      }

      console.log(`  - Found ${rows.length} rows to migrate.`);

      // Batch transactions to Turso for fast insert
      const batchQueries = [];
      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        
        // Convert LibSQL values to primitive Javascript types if needed
        const values = columns.map(col => {
          const val = row[col];
          // Handle BigInt representation from LibSQL client
          if (typeof val === 'bigint') {
            return Number(val);
          }
          return val;
        });

        batchQueries.push({
          sql: `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
          args: values
        });
      }

      // Execute batches in chunks of 50 to avoid payload limits
      const chunkSize = 50;
      let insertedCount = 0;
      for (let i = 0; i < batchQueries.length; i += chunkSize) {
        const chunk = batchQueries.slice(i, i + chunkSize);
        await remoteClient.batch(chunk, "write");
        insertedCount += chunk.length;
        console.log(`  - Migrated rows ${insertedCount}/${rows.length}...`);
      }
      console.log(`  - Table "${tableName}" data transfer complete.`);
    }

    // 4. Recreate Indexes
    console.log('\nStep 4: Creating indexes on remote database...');
    const indexesResult = await localClient.execute(
      "SELECT sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL;"
    );
    const indexes = indexesResult.rows;

    for (const index of indexes) {
      const indexSql = index.sql;
      console.log(`- Executing: ${indexSql.substring(0, 50)}...`);
      try {
        await remoteClient.execute(indexSql);
      } catch (err) {
        // Index might already exist due to unique constraints
        console.log(`  (Skipped or already exists: ${err.message})`);
      }
    }
    console.log('Indexes synced successfully.');

    console.log('\n=== Database Migration Completed Successfully! ===');
    console.log('Your local SQLite database is fully uploaded to Turso.');

  } catch (error) {
    console.error('\n!!! Migration Failed !!!');
    console.error(error);
  } finally {
    // Close connections
    localClient.close();
    remoteClient.close();
  }
}

migrate();

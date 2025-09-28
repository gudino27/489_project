const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { open } = require('sqlite');

async function migrateTitleColumn() {
  console.log('🔧 Starting migration to add title column to invoice_line_items...\n');

  // Use production database path
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'database', 'cabinet_photos.db');
  console.log('Database path:', dbPath);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Check if title column already exists
    const tableInfo = await db.all("PRAGMA table_info(invoice_line_items)");
    const titleColumnExists = tableInfo.some(column => column.name === 'title');

    if (titleColumnExists) {
      console.log('✅ Title column already exists in invoice_line_items table');
    } else {
      // Add the title column
      await db.exec('ALTER TABLE invoice_line_items ADD COLUMN title TEXT');
      console.log('✅ Successfully added title column to invoice_line_items table');
    }

    // Verify the migration
    const updatedTableInfo = await db.all("PRAGMA table_info(invoice_line_items)");
    console.log('\n📋 Current invoice_line_items schema:');
    updatedTableInfo.forEach(column => {
      console.log(`  - ${column.name}: ${column.type}${column.notnull ? ' NOT NULL' : ''}${column.dflt_value ? ` DEFAULT ${column.dflt_value}` : ''}`);
    });

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  migrateTitleColumn().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateTitleColumn };
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { open } = require('sqlite');

// Create database file
const dbPath = path.join(__dirname,'database','cabinet_photos.db');
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
  // Photos table
  db.run(`
    CREATE TABLE IF NOT EXISTS photos(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      category TEXT NOT NULL,
      file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      file_size INTEGER,
      mime_type TEXT,
      width INTEGER,
      height INTEGER,
      featured BOOLEAN DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table (optional, for managing categories)
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Photo metadata table (for additional info)
  db.run(`
    CREATE TABLE IF NOT EXISTS photo_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_id INTEGER NOT NULL,
      meta_key TEXT NOT NULL,
      meta_value TEXT,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    )
  `);
  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_photos_featured ON photos(featured)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_photos_uploaded ON photos(uploaded_at)`);

  // Insert default categories
  const categories = [
    { name: 'Kitchen', slug: 'kitchen', icon: '🍳', order: 1 },
    { name: 'Bathroom', slug: 'bathroom', icon: '🚿', order: 2 },
    { name: 'Living Room', slug: 'livingroom', icon: '🛋️', order: 3 },
    { name: 'Bedroom', slug: 'bedroom', icon: '🛏️', order: 4 },
    { name: 'Laundry Room', slug: 'laundryroom', icon: '🧺', order: 5 },
    { name: 'Showcase', slug: 'showcase', icon: '✨', order: 6 }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO categories (name, slug, icon, display_order) 
    VALUES (?, ?, ?, ?)
  `);

  categories.forEach(cat => {
    stmt.run(cat.name, cat.slug, cat.icon, cat.order);
  });

  stmt.finalize();

  console.log('Database initialized successfully!');
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      bio TEXT,
      email TEXT,
      phone TEXT,
      photo_path TEXT,
      photo_filename TEXT,
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      joined_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create index for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_employees_order ON employees(display_order)`);
  
  const insertEmployee = db.prepare(`
    INSERT OR IGNORE INTO employees (name, position, bio, email, phone, display_order) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  
  
  insertEmployee.finalize();
});

db.close();

async function addPriceTables() {
  console.log('Adding price management tables to database...\n');
  
  const db = await open({
    filename: path.join(__dirname, 'database', 'cabinet_photos.db'),
    driver: sqlite3.Database
  });

  try {
    // Create cabinet prices table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS cabinet_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cabinet_type TEXT NOT NULL UNIQUE,
        base_price DECIMAL(10, 2) NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT
      )
    `);
    console.log('✓ Created cabinet_prices table');

    // Create material pricing table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS material_pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_type TEXT NOT NULL UNIQUE,
        multiplier DECIMAL(3, 2) NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT
      )
    `);
    console.log('✓ Created material_pricing table');

    // Create color pricing table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS color_pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        color_count TEXT NOT NULL UNIQUE,
        price_addition DECIMAL(10, 2) NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT
      )
    `);
    console.log('✓ Created color_pricing table');

    // Insert default cabinet prices
    const defaultCabinetPrices = [
      ['base', 250.00],
      ['sink-base', 320.00],
      ['wall', 180.00],
      ['tall', 450.00],
      ['corner', 380.00],
      ['vanity', 280.00],
      ['vanity-sink', 350.00],
      ['medicine', 120.00],
      ['linen', 350.00]
    ];

    for (const [type, price] of defaultCabinetPrices) {
      await db.run(
        'INSERT OR IGNORE INTO cabinet_prices (cabinet_type, base_price) VALUES (?, ?)',
        [type, price]
      );
    }
    console.log('✓ Inserted default cabinet prices');

    // Insert default material multipliers
    const defaultMaterials = [
      ['laminate', 1.0],
      ['wood', 1.5],
      ['plywood', 1.3]
    ];

    for (const [material, multiplier] of defaultMaterials) {
      await db.run(
        'INSERT OR IGNORE INTO material_pricing (material_type, multiplier) VALUES (?, ?)',
        [material, multiplier]
      );
    }
    console.log('✓ Inserted default material multipliers');

    // Insert default color pricing
    const defaultColors = [
      ['1', 0],
      ['2', 100],
      ['3', 200],
      ['custom', 500]
    ];

    for (const [count, price] of defaultColors) {
      await db.run(
        'INSERT OR IGNORE INTO color_pricing (color_count, price_addition) VALUES (?, ?)',
        [count, price]
      );
    }
    console.log('✓ Inserted default color pricing');

    // Verify data
    console.log('\nVerifying data:');
    const cabinetPrices = await db.all('SELECT * FROM cabinet_prices');
    console.log(`  Cabinet prices: ${cabinetPrices.length} entries`);
    
    const materials = await db.all('SELECT * FROM material_pricing');
    console.log(`  Material multipliers: ${materials.length} entries`);
    
    const colors = await db.all('SELECT * FROM color_pricing');
    console.log(`  Color pricing: ${colors.length} entries`);

  } catch (error) {
    console.error('Error setting up price tables:', error);
  } finally {
    await db.close();
    console.log('\nDatabase setup complete!');
  }
}

async function addDesignsTable() {
  console.log('Adding designs table to database...\n');
  
  const db = await open({
    filename: path.join(__dirname, 'database', 'cabinet_photos.db'),
    driver: sqlite3.Database
  });

  try {
    // Create designs table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS designs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_name TEXT NOT NULL,
        client_email TEXT,
        client_phone TEXT,
        contact_preference TEXT NOT NULL,
        kitchen_data TEXT,
        bathroom_data TEXT,
        include_kitchen BOOLEAN DEFAULT 0,
        include_bathroom BOOLEAN DEFAULT 0,
        total_price DECIMAL(10, 2),
        comments TEXT,
        pdf_data BLOB,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        viewed_at DATETIME,
        viewed_by TEXT
      )
    `);
    console.log('✓ Created designs table');

    // Create indexes for better performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_designs_status ON designs(status);
      CREATE INDEX IF NOT EXISTS idx_designs_created ON designs(created_at);
      CREATE INDEX IF NOT EXISTS idx_designs_client ON designs(client_name);
    `);
    console.log('✓ Created indexes for designs table');

    console.log('\nDesigns table added successfully!');
  } catch (error) {
    console.error('Error adding designs table:', error);
  } finally {
    await db.close();
  }
}
async function addImageColumns() {
  console.log('Adding image columns to designs table...\n');
  
  const db = await open({
    filename: path.join(__dirname, 'database', 'cabinet_photos.db'),
    driver: sqlite3.Database
  });

  try {
    // Add columns for storing design images
    await db.exec(`
      ALTER TABLE designs ADD COLUMN floor_plan_image TEXT;
    `);
    console.log('✓ Added floor_plan_image column');

    await db.exec(`
      ALTER TABLE designs ADD COLUMN wall_view_images TEXT;
    `);
    console.log('✓ Added wall_view_images column');

    console.log('\nImage columns added successfully!');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('Columns already exist, skipping...');
    } else {
      console.error('Error adding columns:', error);
    }
  } finally {
    await db.close();
  }
}

// Run the setups
addImageColumns();
addDesignsTable();
addPriceTables();

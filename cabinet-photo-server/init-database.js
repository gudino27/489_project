const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

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
async function addUserTables() {
  console.log('Adding user management tables to database...\n');
  
  const db = await open({
    filename: path.join(__dirname, 'database', 'cabinet_photos.db'),
    driver: sqlite3.Database
  });

  try {
    // Create users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        full_name TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✓ Created users table');

    // Create user sessions table for secure authentication
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created user_sessions table');

    // Create activity logs table for analytics
    await db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✓ Created activity_logs table');

    // Create site analytics table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS site_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_path TEXT NOT NULL,
        visitor_ip TEXT,
        visitor_id TEXT,
        referrer TEXT,
        user_agent TEXT,
        session_duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created site_analytics table');

    // Create indexes for better performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_created ON site_analytics(created_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_page ON site_analytics(page_path);
    `);
    console.log('✓ Created indexes');

    // Insert default super admin user
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('superadmin123', 10);
    
    await db.run(
      `INSERT OR IGNORE INTO users (username, email, password_hash, role, full_name) 
       VALUES (?, ?, ?, ?, ?)`,
      ['superadmin', 'admin@masterbuildcabinets.com', defaultPassword, 'super_admin', 'Super Administrator']
    );
    console.log('✓ Created default super admin user (username: superadmin, password: superadmin123)');

  } catch (error) {
    console.error('Error setting up user tables:', error);
  } finally {
    await db.close();
    console.log('\nUser management tables setup complete!');
  }
}
async function setupAuthTables() {
  console.log('Setting up authentication and analytics tables...\n');
  
  const db = await open({
    filename: path.join(__dirname, 'database', 'cabinet_photos.db'),
    driver: sqlite3.Database
  });

  try {
    // Create users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        full_name TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✓ Created users table');

    // Create user sessions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created user_sessions table');

    // Create activity logs table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✓ Created activity_logs table');

    // Create site analytics table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS site_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_path TEXT NOT NULL,
        visitor_ip TEXT,
        visitor_id TEXT,
        referrer TEXT,
        user_agent TEXT,
        session_duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created site_analytics table');

    // Create indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_created ON site_analytics(created_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_page ON site_analytics(page_path);
    `);
    console.log('✓ Created indexes');

    // Check if super admin already exists
    const existingAdmin = await db.get(
      'SELECT id FROM users WHERE username = ?',
      ['superadmin']
    );

    if (!existingAdmin) {
      // Create default super admin user
      const defaultPassword = await bcrypt.hash('changeme123', 10);
      
      await db.run(
        `INSERT INTO users (username, email, password_hash, role, full_name) 
         VALUES (?, ?, ?, ?, ?)`,
        ['superadmin', 'admin@masterbuildcabinets.com', defaultPassword, 'super_admin', 'Super Administrator']
      );
      
      console.log('\n✓ Created default super admin user');
      console.log('\n========================================');
      console.log('Default Super Admin Credentials:');
      console.log('Username: superadmin');
      console.log('Password: changeme123');
      console.log('========================================');
      console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!');
    } else {
      console.log('\n✓ Super admin user already exists');
    }

    // Verify all tables exist
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    console.log('\n✓ Database tables verified:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });

  } catch (error) {
    console.error('\n❌ Error setting up tables:', error);
    throw error;
  } finally {
    await db.close();
    console.log('\n✅ Setup completed successfully!');
  }
}
// Run the setups
addImageColumns();
addDesignsTable();
addPriceTables();
addUserTables();

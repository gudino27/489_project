const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  console.log('Starting database initialization...\n');

  const dbPath = path.join(__dirname, 'database', 'cabinet_photos.db');

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Enable WAL mode for better concurrency
    await db.exec('PRAGMA journal_mode=WAL');

    console.log(' Creating basic tables...');
    await createBasicTables(db);

    console.log(' Adding design tables...');
    await addDesignTables(db);

    console.log(' Adding price tables...');
    await addPriceTables(db);

    console.log(' Adding user tables...');
    await addUserTables(db);

    console.log(' Adding analytics tables...');
    await addAnalyticsTables(db);

    console.log(' Adding testimonial tables...');
    await addTestimonialTables(db);

    console.log(' Adding invoice tables...');
    await addInvoiceTables(db);

    console.log('\n Database initialization completed successfully!');

  } catch (error) {
    console.error(' Error during database initialization:', error);
    throw error;
  } finally {
    await db.close();
  }
}

async function createBasicTables(db) {
  // Photos table
  await db.exec(`
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

  // Categories table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Photo metadata table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS photo_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_id INTEGER NOT NULL,
      meta_key TEXT NOT NULL,
      meta_value TEXT,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    )
  `);

  // Employees table
  await db.exec(`
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

  // Create indexes
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
    CREATE INDEX IF NOT EXISTS idx_photos_featured ON photos(featured);
    CREATE INDEX IF NOT EXISTS idx_photos_uploaded ON photos(uploaded_at);
    CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
    CREATE INDEX IF NOT EXISTS idx_employees_order ON employees(display_order);
  `);

  // Insert default categories
  const categories = [
    { name: 'Kitchen', slug: 'kitchen', icon: '🍳', order: 1 },
    { name: 'Bathroom', slug: 'bathroom', icon: '🚿', order: 2 },
    { name: 'Living Room', slug: 'livingroom', icon: '🛋️', order: 3 },
    { name: 'Bedroom', slug: 'bedroom', icon: '🛏️', order: 4 },
    { name: 'Laundry Room', slug: 'laundryroom', icon: '🧺', order: 5 },
    { name: 'Showcase', slug: 'showcase', icon: '✨', order: 6 }
  ];

  for (const cat of categories) {
    await db.run(
      'INSERT OR IGNORE INTO categories (name, slug, icon, display_order) VALUES (?, ?, ?, ?)',
      [cat.name, cat.slug, cat.icon, cat.order]
    );
  }

  console.log(' Created basic tables and default categories');
}

async function addDesignTables(db) {
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
      viewed_by TEXT,
      floor_plan_image TEXT,
      wall_view_images TEXT
    )
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_designs_status ON designs(status);
    CREATE INDEX IF NOT EXISTS idx_designs_created ON designs(created_at);
    CREATE INDEX IF NOT EXISTS idx_designs_client ON designs(client_name);
  `);

  console.log(' Created designs table');
}

async function addPriceTables(db) {
  // Cabinet prices table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cabinet_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cabinet_type TEXT NOT NULL UNIQUE,
      base_price DECIMAL(10, 2) NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);

  // Create material pricing table with old structure first, then migrate
  await db.exec(`
    CREATE TABLE IF NOT EXISTS material_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_type TEXT NOT NULL UNIQUE,
      multiplier DECIMAL(3, 2) NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);

  // Now migrate to bilingual structure if needed
  try {
    // Check if old structure exists
    const tableInfo = await db.all("PRAGMA table_info(material_pricing)");
    const hasOldStructure = tableInfo.some(col => col.name === 'material_type');
    const hasNewStructure = tableInfo.some(col => col.name === 'material_name_en');

    if (hasOldStructure && !hasNewStructure) {
      console.log('🔄 Migrating material_pricing table to bilingual structure...');

      // Get existing data
      const existingMaterials = await db.all('SELECT * FROM material_pricing');

      // Create new table with bilingual structure
      await db.exec(`
        CREATE TABLE material_pricing_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          material_name_en TEXT NOT NULL,
          material_name_es TEXT NOT NULL,
          multiplier DECIMAL(3, 2) NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT,
          UNIQUE(material_name_en, material_name_es)
        )
      `);

      // Migrate data with appropriate translations
      const materialTranslations = {
        'laminate': { en: 'Laminate', es: 'Laminado' },
        'wood': { en: 'Wood', es: 'Madera' },
        'plywood': { en: 'Plywood', es: 'Madera Contrachapada' }
      };

      for (const material of existingMaterials) {
        const translation = materialTranslations[material.material_type.toLowerCase()] || {
          en: material.material_type.charAt(0).toUpperCase() + material.material_type.slice(1),
          es: material.material_type.charAt(0).toUpperCase() + material.material_type.slice(1)
        };

        await db.run(
          'INSERT INTO material_pricing_new (material_name_en, material_name_es, multiplier, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)',
          [translation.en, translation.es, material.multiplier, material.updated_at, material.updated_by]
        );
      }

      // Replace old table
      await db.exec('DROP TABLE material_pricing');
      await db.exec('ALTER TABLE material_pricing_new RENAME TO material_pricing');

      console.log('✓ Successfully migrated material_pricing table to bilingual structure');
    } else if (!hasOldStructure && !hasNewStructure) {
      // Fresh install - create with new structure
      await db.exec('DROP TABLE material_pricing');
      await db.exec(`
        CREATE TABLE material_pricing (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          material_name_en TEXT NOT NULL,
          material_name_es TEXT NOT NULL,
          multiplier DECIMAL(3, 2) NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_by TEXT,
          UNIQUE(material_name_en, material_name_es)
        )
      `);
      console.log('✓ Created material_pricing table with bilingual structure');
    }
  } catch (error) {
    console.error('Error handling material_pricing table structure:', error);
    throw error;
  }

  // Color pricing table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS color_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      color_count TEXT NOT NULL UNIQUE,
      price_addition DECIMAL(10, 2) NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);

  // Wall availability table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS wall_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_type TEXT NOT NULL UNIQUE,
      is_enabled BOOLEAN DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);

  // Insert default data
  const defaultCabinetPrices = [
    ['base', 250.00], ['sink-base', 320.00], ['wall', 180.00],
    ['tall', 450.00], ['corner', 380.00], ['drawer-base', 280.00],
    ['double-drawer-base', 350.00], ['glass-wall', 220.00], ['open-shelf', 160.00],
    ['island-base', 580.00], ['peninsula-base', 420.00], ['pantry', 520.00],
    ['corner-wall', 210.00], ['lazy-susan', 450.00], ['blind-corner', 320.00],
    ['appliance-garage', 280.00], ['wine-rack', 350.00], ['spice-rack', 180.00],
    ['tray-divider', 200.00], ['pull-out-drawer', 250.00], ['soft-close-drawer', 300.00],
    ['under-cabinet-lighting', 150.00], ['vanity', 280.00], ['vanity-sink', 350.00],
    ['double-vanity', 650.00], ['floating-vanity', 420.00], ['corner-vanity', 380.00],
    ['vanity-tower', 320.00], ['medicine', 120.00], ['medicine-mirror', 180.00],
    ['linen', 350.00], ['linen-tower', 420.00], ['wall-hung-vanity', 380.00],
    ['vessel-sink-vanity', 400.00], ['undermount-sink-vanity', 380.00], ['powder-room-vanity', 250.00],
    ['master-bath-vanity', 750.00], ['kids-bathroom-vanity', 220.00]
  ];

  for (const [type, price] of defaultCabinetPrices) {
    await db.run(
      'INSERT OR IGNORE INTO cabinet_prices (cabinet_type, base_price) VALUES (?, ?)',
      [type, price]
    );
  }

  // Insert default materials (check structure first)
  const tableInfo = await db.all("PRAGMA table_info(material_pricing)");
  const hasNewStructure = tableInfo.some(col => col.name === 'material_name_en');

  if (hasNewStructure) {
    // New bilingual structure
    const defaultMaterials = [
      ['Laminate', 'Laminado', 1.0],
      ['Wood', 'Madera', 1.5],
      ['Plywood', 'Madera Contrachapada', 1.3]
    ];
    for (const [materialEn, materialEs, multiplier] of defaultMaterials) {
      await db.run(
        'INSERT OR IGNORE INTO material_pricing (material_name_en, material_name_es, multiplier) VALUES (?, ?, ?)',
        [materialEn, materialEs, multiplier]
      );
    }
  } else {
    // Old structure (should not happen due to migration above, but fallback)
    const defaultMaterials = [['laminate', 1.0], ['wood', 1.5], ['plywood', 1.3]];
    for (const [material, multiplier] of defaultMaterials) {
      await db.run(
        'INSERT OR IGNORE INTO material_pricing (material_type, multiplier) VALUES (?, ?)',
        [material, multiplier]
      );
    }
  }

  const defaultColors = [['1', 0], ['2', 100], ['3', 200], ['custom', 500]];
  for (const [count, price] of defaultColors) {
    await db.run(
      'INSERT OR IGNORE INTO color_pricing (color_count, price_addition) VALUES (?, ?)',
      [count, price]
    );
  }

  const defaultWallAvailability = [['addWall', 1], ['removeWall', 1]];
  for (const [service, enabled] of defaultWallAvailability) {
    await db.run(
      'INSERT OR IGNORE INTO wall_availability (service_type, is_enabled) VALUES (?, ?)',
      [service, enabled]
    );
  }

  console.log(' Created price tables and default data');
}

async function addUserTables(db) {
  // Users table
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

  // User sessions table
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

  // Activity logs table(not used yet but for future use)
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

  // Password reset tokens table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Site analytics table(not used yet but for future use)
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
    CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_reset_expires ON password_reset_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id);
  `);

  // Add admin_note column to designs table if it doesn't exist (migration)
  try {
    await db.exec(`ALTER TABLE designs ADD COLUMN admin_note TEXT`);
    console.log('✓ Added admin_note column to designs table');
  } catch (error) {
    // Column already exists, ignore error
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding admin_note column:', error);
    }
  }


  // Create default admin user
  const existingAdmin = await db.get('SELECT id FROM users WHERE username = ?', ['superadmin']);

  if (!existingAdmin) {
    const defaultPassword = await bcrypt.hash('changeme123', 10);

    await db.run(
      'INSERT INTO users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)',
      ['superadmin', 'admin@gudinocustom.com', defaultPassword, 'super_admin', 'Super Administrator']
    );

    console.log(' Created default super admin user (username: superadmin, password: changeme123)');
  } else {
    console.log(' Super admin user already exists');
  }

  console.log(' Created user authentication system');
}

async function addAnalyticsTables(db) {
  // Page analytics table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS page_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_path TEXT NOT NULL,
      user_agent TEXT,
      ip_address TEXT,
      referrer TEXT,
      session_id TEXT,
      user_id INTEGER,
      time_spent_seconds INTEGER,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes for analytics
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_page_analytics_path ON page_analytics(page_path);
    CREATE INDEX IF NOT EXISTS idx_page_analytics_viewed ON page_analytics(viewed_at);
    CREATE INDEX IF NOT EXISTS idx_page_analytics_session ON page_analytics(session_id);
    CREATE INDEX IF NOT EXISTS idx_page_analytics_user ON page_analytics(user_id);
  `);

  console.log(' Created analytics tables');
}

async function addTestimonialTables(db) {
  // Testimonial tokens table for tracking sent links
  await db.exec(`
    CREATE TABLE IF NOT EXISTS testimonial_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      project_type TEXT,
      sent_by INTEGER,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sent_by) REFERENCES users(id)
    )
  `);

  // Testimonials table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_email TEXT,
      message TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      project_type TEXT,
      is_visible BOOLEAN DEFAULT 1,
      token_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      approved_by INTEGER,
      FOREIGN KEY (token_id) REFERENCES testimonial_tokens(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);

  // Testimonial photos table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS testimonial_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      testimonial_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      file_size INTEGER,
      mime_type TEXT,
      width INTEGER,
      height INTEGER,
      display_order INTEGER DEFAULT 0,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (testimonial_id) REFERENCES testimonials(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for testimonials
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_testimonial_tokens_token ON testimonial_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_testimonial_tokens_expires ON testimonial_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_testimonial_tokens_email ON testimonial_tokens(client_email);
    CREATE INDEX IF NOT EXISTS idx_testimonials_visible ON testimonials(is_visible);
    CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);
    CREATE INDEX IF NOT EXISTS idx_testimonials_created ON testimonials(created_at);
    CREATE INDEX IF NOT EXISTS idx_testimonial_photos_testimonial ON testimonial_photos(testimonial_id);
    CREATE INDEX IF NOT EXISTS idx_testimonial_photos_order ON testimonial_photos(display_order);
  `);

  console.log(' Created testimonial tables and indexes');
}

async function addInvoiceTables(db) {
  // Clients table for invoice system
  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      is_business BOOLEAN DEFAULT 0,
      tax_exempt_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Line item labels for customizable dropdown options
  await db.exec(`
    CREATE TABLE IF NOT EXISTS line_item_labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label_name TEXT NOT NULL UNIQUE,
      default_unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Invoices table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      invoice_date DATE NOT NULL,
      due_date DATE NOT NULL,
      status TEXT DEFAULT 'draft',
      subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      tax_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.00,
      tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      discount_amount DECIMAL(10, 2) DEFAULT 0.00,
      markup_amount DECIMAL(10, 2) DEFAULT 0.00,
      total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      logo_url TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // Invoice line items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
      unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      item_type TEXT DEFAULT 'material',
      line_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `);

  // Invoice tokens for persistent client access
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      invoice_id INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      viewed_at DATETIME,
      view_count INTEGER DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `);

  // Invoice payments tracking
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      payment_amount DECIMAL(10, 2) NOT NULL,
      payment_method TEXT NOT NULL,
      check_number TEXT,
      payment_date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Tax rates table for multi-state support
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tax_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state_code TEXT NOT NULL,
      county TEXT,
      city TEXT,
      tax_rate DECIMAL(5, 4) NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `);

  // Create indexes for invoice tables
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
    CREATE INDEX IF NOT EXISTS idx_clients_business ON clients(is_business);
    CREATE INDEX IF NOT EXISTS idx_clients_created ON clients(created_at);
    CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
    CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON invoice_line_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_tokens_token ON invoice_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_tokens_invoice ON invoice_tokens(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_tokens_active ON invoice_tokens(is_active);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON invoice_payments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON invoice_payments(payment_date);
    CREATE INDEX IF NOT EXISTS idx_tax_rates_state ON tax_rates(state_code);
    CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active);
  `);

  // Insert default line item labels
  const defaultLabels = [
    ['Cabinet - Base', 250.00],
    ['Cabinet - Wall', 180.00],
    ['Cabinet - Tall', 450.00],
    ['Hardware - Handles', 15.00],
    ['Hardware - Hinges', 8.00],
    ['Labor - Installation', 85.00],
    ['Labor - Demolition', 45.00],
    ['Material - Wood', 12.00],
    ['Material - Plywood', 8.00],
    ['Appliance - Built-in', 500.00],
    ['Countertop - Linear Foot', 75.00],
    ['Backsplash - Square Foot', 12.00],
    ['Paint - Per Room', 200.00],
    ['Electrical - Outlet', 150.00],
    ['Plumbing - Connection', 200.00]
  ];

  for (const [labelName, defaultPrice] of defaultLabels) {
    await db.run(
      'INSERT OR IGNORE INTO line_item_labels (label_name, default_unit_price) VALUES (?, ?)',
      [labelName, defaultPrice]
    );
  }

  // Insert default tax rates for WA, OR, ID
  const defaultTaxRates = [
    ['WA', null, null, 0.065], // Washington base rate 6.5%
    ['OR', null, null, 0.0],   // Oregon no sales tax
    ['ID', null, null, 0.06]   // Idaho base rate 6%
  ];

  for (const [state, county, city, rate] of defaultTaxRates) {
    await db.run(
      'INSERT OR IGNORE INTO tax_rates (state_code, county, city, tax_rate) VALUES (?, ?, ?, ?)',
      [state, county, city, rate]
    );
  }

  console.log(' Created invoice system tables and default data');
}

// Only run if this file is executed directly
if (require.main === module) {
  initializeDatabase().catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase };

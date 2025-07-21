const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
// Database connection helper
async function getDb() {
  const db = await open({
    filename: path.join(__dirname,'database' ,'cabinet_photos.db'),
    driver: sqlite3.Database
  });
  return db;
}
var fullpath= path.join(__dirname,'database' ,'cabinet_photos.db');
console.log(fullpath);
fullpath =path.join(__dirname, '..', 'database', 'cabinet_photos.db');
console.log(fullpath);
// Photo database operations
const photoDb = {
  async getAllPhotos() {
    const db = await getDb();
    const photos = await db.all('SELECT * FROM photos ORDER BY display_order ASC, uploaded_at DESC');
    await db.close();
    return photos;
  },

  async getPhotoById(id) {
    const db = await getDb();
    const photo = await db.get('SELECT * FROM photos WHERE id = ?', [id]);
    await db.close();
    return photo;
  },

  // Add alias for backward compatibility
  async getPhoto(id) {
    return this.getPhotoById(id);
  },

  async getPhotosByCategory(category) {
    const db = await getDb();
    const photos = await db.all(
      'SELECT * FROM photos WHERE category = ? ORDER BY display_order ASC, uploaded_at DESC',
      [category]
    );
    await db.close();
    return photos;
  },

  async createPhoto(photoData) {
    const db = await getDb();
    const {
      title, filename, original_name, category, file_path,
      thumbnail_path, file_size, mime_type, width, height
    } = photoData;

    const result = await db.run(
      `INSERT INTO photos (
        title, filename, original_name, category, file_path,
        thumbnail_path, file_size, mime_type, width, height
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, filename, original_name, category, file_path,
       thumbnail_path, file_size, mime_type, width, height]
    );

    await db.close();
    return result.lastID;
  },

  async updatePhoto(id, updates) {
    const db = await getDb();
    
    const fields = [];
    const values = [];
    
    // Only update provided fields
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.featured !== undefined) {
      fields.push('featured = ?');
      values.push(updates.featured ? 1 : 0);
    }
    if (updates.display_order !== undefined) {
      fields.push('display_order = ?');
      values.push(updates.display_order);
    }
    
    if (fields.length === 0) {
      await db.close();
      return false;
    }
    
    values.push(id);
    
    await db.run(
      `UPDATE photos SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    await db.close();
    return true;
  },

  async updatePhotoOrder(photoId, displayOrder) {
    const db = await getDb();
    await db.run(
      'UPDATE photos SET display_order = ? WHERE id = ?',
      [displayOrder, photoId]
    );
    await db.close();
  },

  async updatePhotoOrders(orderUpdates) {
    const db = await getDb();
    
    for (const update of orderUpdates) {
      await db.run(
        'UPDATE photos SET display_order = ? WHERE id = ?',
        [update.display_order, update.id]
      );
    }
    
    await db.close();
  },

  async deletePhoto(id) {
    const db = await getDb();
    const photo = await db.get('SELECT * FROM photos WHERE id = ?', [id]);
    
    if (photo) {
      await db.run('DELETE FROM photos WHERE id = ?', [id]);
    }
    
    await db.close();
    return photo;
  },

  async searchPhotos(searchTerm) {
    const db = await getDb();
    const photos = await db.all(
      `SELECT * FROM photos 
       WHERE title LIKE ? OR category LIKE ? 
       ORDER BY display_order ASC, uploaded_at DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
    await db.close();
    return photos;
  },

  async getPhotoStats() {
    const db = await getDb();
    
    try {
      const stats = {};
      
      // Total photos
      const totalResult = await db.get('SELECT COUNT(*) as count FROM photos');
      stats.total = totalResult.count;
      
      // Photos by category
      const categoryResults = await db.all(
        'SELECT category, COUNT(*) as count FROM photos GROUP BY category'
      );
      stats.byCategory = {};
      categoryResults.forEach(row => {
        stats.byCategory[row.category] = row.count;
      });
      
      // Featured photos
      const featuredResult = await db.get('SELECT COUNT(*) as count FROM photos WHERE featured = 1');
      stats.featured = featuredResult.count;
      
      await db.close();
      return stats;
    } catch (error) {
      await db.close();
      throw error;
    }
  }
};

// Employee database operations
const employeeDb = {
  // Insert new employee
  async insertEmployee(employeeData) {
    const db = await getDb();
    
    try {
      const {
        name,
        position,
        bio,
        email,
        phone,
        photo_path,
        photo_filename,
        joined_date,
        display_order
      } = employeeData;
      
      const result = await db.run(
        `INSERT INTO employees (
          name, position, bio, email, phone, 
          photo_path, photo_filename, joined_date, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          position,
          bio || '',
          email || '',
          phone || '',
          photo_path,
          photo_filename,
          joined_date,
          display_order || 999
        ]
      );
      
      await db.close();
      return result.lastID;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Get single employee
  async getEmployee(id) {
    const db = await getDb();
    
    try {
      const employee = await db.get(
        'SELECT * FROM employees WHERE id = ?',
        [id]
      );
      
      await db.close();
      return employee;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async getAllEmployees() {
    const db = await getDb();
    const employees = await db.all(
      'SELECT * FROM employees WHERE is_active = 1 ORDER BY display_order ASC'
    );
    await db.close();
    return employees;
  },

  async getEmployeeById(id) {
    const db = await getDb();
    const employee = await db.get('SELECT * FROM employees WHERE id = ?', [id]);
    await db.close();
    return employee;
  },

  async createEmployee(employeeData) {
    const db = await getDb();
    const {
      name, position, bio, email, phone,
      photo_path, photo_filename, joined_date
    } = employeeData;

    const result = await db.run(
      `INSERT INTO employees (
        name, position, bio, email, phone,
        photo_path, photo_filename, joined_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, position, bio, email, phone,
       photo_path, photo_filename, joined_date]
    );

    await db.close();
    return result.lastID;
  },

  async updateEmployee(id, updates) {
    const db = await getDb();
    
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (fields.length > 0) {
      values.push(id);
      await db.run(
        `UPDATE employees SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }
    
    await db.close();
  },

  async deleteEmployee(id) {
    const db = await getDb();
    await db.run('UPDATE employees SET is_active = 0 WHERE id = ?', [id]);
    await db.close();
  },

  // Delete employee
  async deleteEmployee(id, hardDelete = false) {
    const db = await getDb();
    
    try {
      let result;
      
      if (hardDelete) {
        result = await db.run('DELETE FROM employees WHERE id = ?', [id]);
      } else {
        result = await db.run(
          'UPDATE employees SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );
      }
      
      await db.close();
      return result.changes > 0;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async updateEmployeeOrder(employeeId, displayOrder) {
    const db = await getDb();
    await db.run(
      'UPDATE employees SET display_order = ? WHERE id = ?',
      [displayOrder, employeeId]
    );
    await db.close();
  },

  async updateEmployeeOrders(orderUpdates) {
    const db = await getDb();
    
    for (const update of orderUpdates) {
      await db.run(
        'UPDATE employees SET display_order = ? WHERE id = ?',
        [update.display_order, update.id]
      );
    }
    
    await db.close();
  },

  async searchEmployees(searchTerm) {
    const db = await getDb();
    const employees = await db.all(
      `SELECT * FROM employees 
       WHERE (name LIKE ? OR position LIKE ? OR email LIKE ?) 
       AND is_active = 1
       ORDER BY display_order ASC, name ASC`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    await db.close();
    return employees;
  }
};

// Design database operations
const designDb = {
  async saveDesign(designData) {
    const db = await getDb();
    
    try {
      const {
        client_name,
        client_email,
        client_phone,
        contact_preference,
        kitchen_data,
        bathroom_data,
        include_kitchen,
        include_bathroom,
        total_price,
        comments,
        pdf_data,
        floor_plan_image,
        wall_view_images
      } = designData;

      const result = await db.run(
        `INSERT INTO designs (
          client_name, client_email, client_phone, contact_preference,
          kitchen_data, bathroom_data, include_kitchen, include_bathroom,
          total_price, comments, pdf_data, floor_plan_image, wall_view_images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client_name, 
          client_email, 
          client_phone, 
          contact_preference,
          kitchen_data ? JSON.stringify(kitchen_data) : null,
          bathroom_data ? JSON.stringify(bathroom_data) : null,
          include_kitchen ? 1 : 0, 
          include_bathroom ? 1 : 0,
          total_price, 
          comments, 
          pdf_data,
          floor_plan_image,
          wall_view_images ? JSON.stringify(wall_view_images) : null
        ]
      );

      await db.close();
      return result.lastID;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async getDesign(id) {
    const db = await getDb();
    
    try {
      const design = await db.get('SELECT * FROM designs WHERE id = ?', [id]);
      
      if (design) {
        // Parse JSON fields
        if (design.kitchen_data) design.kitchen_data = JSON.parse(design.kitchen_data);
        if (design.bathroom_data) design.bathroom_data = JSON.parse(design.bathroom_data);
        if (design.wall_view_images) design.wall_view_images = JSON.parse(design.wall_view_images);
        
        // Mark as viewed
        await db.run(
          'UPDATE designs SET viewed_at = CURRENT_TIMESTAMP WHERE id = ? AND viewed_at IS NULL',
          [id]
        );
      }
      
      await db.close();
      return design;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async getAllDesigns() {
    const db = await getDb();
    const designs = await db.all(
      'SELECT id, client_name, client_email, total_price, status, created_at, viewed_at FROM designs ORDER BY created_at DESC'
    );
    await db.close();
    return designs;
  },

  async updateDesignStatus(id, status) {
    const db = await getDb();
    await db.run('UPDATE designs SET status = ? WHERE id = ?', [status, id]);
    await db.close();
  },

  async searchDesigns(searchTerm) {
    const db = await getDb();
    const designs = await db.all(
      `SELECT id, client_name, client_email, total_price, status, created_at, viewed_at 
       FROM designs 
       WHERE client_name LIKE ? OR client_email LIKE ? 
       ORDER BY created_at DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
    await db.close();
    return designs;
  },

  // Get design statistics
  async getDesignStats() {
    const db = await getDb();
    
    try {
      // Get basic counts
      const totalDesigns = await db.get('SELECT COUNT(*) as count FROM designs');
      
      // Get status breakdown
      const statusCounts = await db.all(`
        SELECT status, COUNT(*) as count 
        FROM designs 
        GROUP BY status
      `);
      
      // Get total revenue(not implemented)
      const revenue = await db.get('SELECT SUM(total_price) as total FROM designs');
      
      // Get average order value(not implemented )
      const avgOrder = await db.get('SELECT AVG(total_price) as average FROM designs');
      
      const recentDesigns = await db.get(`
        SELECT COUNT(*) as count 
        FROM designs 
        WHERE created_at >= date('now', '-30 days')
      `);
      const monthlyStats = await db.all(`
        SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as count,
          SUM(total_price) as revenue
        FROM designs 
        WHERE created_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month DESC
      `);
      
      // Get room type breakdown
      const roomStats = await db.all(`
        SELECT 
          CASE 
            WHEN include_kitchen = 1 AND include_bathroom = 1 THEN 'Both'
            WHEN include_kitchen = 1 THEN 'Kitchen Only'
            WHEN include_bathroom = 1 THEN 'Bathroom Only'
            ELSE 'None'
          END as room_type,
          COUNT(*) as count,
          AVG(total_price) as avg_price
        FROM designs
        GROUP BY room_type
      `);

      await db.close();
      
      // Format status counts as object
      const statusBreakdown = {};
      statusCounts.forEach(item => {
        statusBreakdown[item.status || 'pending'] = item.count;
      });
      
      return {
        totalDesigns: totalDesigns.count || 0,
        totalRevenue: revenue.total || 0,
        averageOrderValue: avgOrder.average || 0,
        recentDesigns: recentDesigns.count || 0,
        statusBreakdown,
        monthlyStats,
        roomStats
      };
      
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Get design PDF data
  async getDesignPdf(id) {
    const db = await getDb();
    
    try {
      const result = await db.get('SELECT pdf_data FROM designs WHERE id = ?', [id]);
      await db.close();
      
      return result ? result.pdf_data : null;
    } catch (error) {
      await db.close();
      throw error;
    }
  }
};

// User database operations
const userDb = {
  // Create a new user
  async createUser(userData) {
    const db = await getDb();
    const { username, email, password, role, full_name, created_by } = userData;
    
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await db.run(
        `INSERT INTO users (username, email, password_hash, role, full_name, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, role, full_name, created_by]
      );
      
      await db.close();
      return result.lastID;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Authenticate user and return session token
  async authenticateUser(username, password) {
    const db = await getDb();
    
    try {
      const user = await db.get(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [username]
      );
      
      if (!user) {
        await db.close();
        return null;
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        await db.close();
        return null;
      }
      
      // Generate session token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      // Save session
      await db.run(
        `INSERT INTO user_sessions (user_id, token, expires_at)
         VALUES (?, ?, ?)`,
        [user.id, token, expiresAt.toISOString()]
      );
      
      // Update last login
      await db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );
      
      await db.close();
      
      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name
        }
      };
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Validate session token
  async validateSession(token) {
    const db = await getDb();
    
    try {
      const session = await db.get(`
        SELECT s.*, u.id, u.username, u.email, u.role, u.full_name
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
      `, [token]);
      
      if (session) {
        // Extend session
        const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await db.run(
          'UPDATE user_sessions SET expires_at = ? WHERE token = ?',
          [newExpiresAt.toISOString(), token]
        );
      }
      
      await db.close();
      
      return session ? {
        id: session.id,
        username: session.username,
        email: session.email,
        role: session.role,
        full_name: session.full_name
      } : null;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Get all users
  async getAllUsers() {
    const db = await getDb();
    const users = await db.all(`
      SELECT id, username, email, role, full_name, is_active, 
             created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `);
    await db.close();
    return users;
  },

  // Update user
  async updateUser(userId, updates) {
    const db = await getDb();
    const fields = [];
    const values = [];

    // Allowed fields to update
    const allowedFields = ['email', 'role', 'full_name', 'is_active'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });

    if (fields.length === 0) {
      await db.close();
      return false;
    }

    values.push(userId);
    
    const result = await db.run(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    await db.close();
    return result.changes > 0;
  },

  
};

module.exports = { 
  getDb,
  photoDb, 
  employeeDb, 
  designDb, 
  userDb 
};

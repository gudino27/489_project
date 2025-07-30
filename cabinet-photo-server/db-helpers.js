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

  async getAllDesigns(statusFilter = null) {
    const db = await getDb();
    
    let query = 'SELECT id, client_name, client_email, client_phone, contact_preference, total_price, status, created_at, viewed_at, viewed_by, admin_note FROM designs';
    let params = [];
    
    if (statusFilter) {
      query += ' WHERE status = ?';
      params.push(statusFilter);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const designs = await db.all(query, params);
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
  },

  // Update design status
  async updateDesignStatus(id, status, viewedBy) {
    const db = await getDb();
    
    try {
      const result = await db.run(
        'UPDATE designs SET status = ?, viewed_by = ?, viewed_at = datetime("now") WHERE id = ?',
        [status, viewedBy, id]
      );
      
      await db.close();
      return result.changes > 0;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Update design note
  async updateDesignNote(id, note) {
    const db = await getDb();
    
    try {
      const result = await db.run(
        'UPDATE designs SET admin_note = ? WHERE id = ?',
        [note, id]
      );
      
      await db.close();
      return result.changes > 0;
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

  // Password reset functionality
  async createPasswordResetToken(email) {
    const db = await getDb();
    
    try {
      // Find user by email
      const user = await db.get('SELECT id, username, email FROM users WHERE email = ? AND is_active = 1', [email]);
      
      if (!user) {
        await db.close();
        return null; // Don't reveal if email exists
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token
      await db.run(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt.toISOString()]
      );

      await db.close();
      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      };
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async validatePasswordResetToken(token) {
    const db = await getDb();
    
    try {
      const resetRecord = await db.get(`
        SELECT prt.*, u.username, u.email
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ? AND prt.expires_at > datetime('now') AND prt.used_at IS NULL AND u.is_active = 1
      `, [token]);

      await db.close();
      return resetRecord;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async resetPassword(token, newPassword) {
    const db = await getDb();
    
    try {
      // Validate token
      const resetRecord = await this.validatePasswordResetToken(token);
      if (!resetRecord) {
        await db.close();
        return false;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db.run(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, resetRecord.user_id]
      );

      // Mark token as used
      await db.run(
        'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = ?',
        [token]
      );

      await db.close();
      return true;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async cleanupExpiredTokens() {
    const db = await getDb();
    
    try {
      await db.run('DELETE FROM password_reset_tokens WHERE expires_at < datetime("now")');
      await db.close();
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  
};

// Analytics database operations
const analyticsDb = {
  async recordPageView(pageData) {
    const db = await getDb();
    
    try {
      const {
        page_path,
        user_agent,
        ip_address,
        referrer,
        session_id,
        user_id
      } = pageData;
      
      const result = await db.run(
        `INSERT INTO page_analytics (
          page_path, user_agent, ip_address, referrer, session_id, user_id, viewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [page_path, user_agent, ip_address, referrer, session_id, user_id]
      );
      
      await db.close();
      return result.lastID;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async updateTimeSpent(viewId, timeSpent) {
    const db = await getDb();
    
    try {
      await db.run(
        'UPDATE page_analytics SET time_spent_seconds = ? WHERE id = ?',
        [timeSpent, viewId]
      );
      
      await db.close();
      return true;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async getPageViewStats(dateRange = 30) {
    const db = await getDb();
    
    try {
      // Page views by path
      const pageViews = await db.all(`
        SELECT 
          page_path,
          COUNT(*) as view_count,
          AVG(time_spent_seconds) as avg_time_spent,
          COUNT(DISTINCT session_id) as unique_sessions
        FROM page_analytics 
        WHERE viewed_at >= date('now', '-${dateRange} days')
        GROUP BY page_path
        ORDER BY view_count DESC
      `);

      // Daily page views
      const dailyViews = await db.all(`
        SELECT 
          date(viewed_at) as date,
          COUNT(*) as views,
          COUNT(DISTINCT session_id) as unique_sessions
        FROM page_analytics 
        WHERE viewed_at >= date('now', '-${dateRange} days')
        GROUP BY date(viewed_at)
        ORDER BY date DESC
      `);

      // Popular referrers
      const referrers = await db.all(`
        SELECT 
          referrer,
          COUNT(*) as count
        FROM page_analytics 
        WHERE viewed_at >= date('now', '-${dateRange} days')
          AND referrer IS NOT NULL 
          AND referrer != ''
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
      `);

      // Browser stats
      const browsers = await db.all(`
        SELECT 
          CASE 
            WHEN user_agent LIKE '%Chrome%' THEN 'Chrome'
            WHEN user_agent LIKE '%Firefox%' THEN 'Firefox'
            WHEN user_agent LIKE '%Safari%' AND user_agent NOT LIKE '%Chrome%' THEN 'Safari'
            WHEN user_agent LIKE '%Edge%' THEN 'Edge'
            ELSE 'Other'
          END as browser,
          COUNT(*) as count
        FROM page_analytics 
        WHERE viewed_at >= date('now', '-${dateRange} days')
        GROUP BY browser
        ORDER BY count DESC
      `);

      await db.close();
      
      return {
        pageViews,
        dailyViews,
        referrers,
        browsers
      };
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async getRealtimeStats() {
    const db = await getDb();
    
    try {
      // Active sessions in last 30 minutes
      const activeSessions = await db.get(`
        SELECT COUNT(DISTINCT session_id) as count
        FROM page_analytics 
        WHERE viewed_at >= datetime('now', '-30 minutes')
      `);

      // Recent page views
      const recentViews = await db.all(`
        SELECT 
          page_path,
          viewed_at,
          time_spent_seconds
        FROM page_analytics 
        WHERE viewed_at >= datetime('now', '-1 hour')
        ORDER BY viewed_at DESC
        LIMIT 20
      `);

      await db.close();
      
      return {
        activeSessions: activeSessions.count,
        recentViews
      };
    } catch (error) {
      await db.close();
      throw error;
    }
  }
};

// Testimonial database operations
const testimonialDb = {
  async createToken(tokenData) {
    const db = await getDb();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day
    
    const result = await db.run(
      'INSERT INTO testimonial_tokens (token, client_name, client_email, project_type, sent_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [token, tokenData.client_name, tokenData.client_email, tokenData.project_type, tokenData.sent_by, expiresAt]
    );
    
    await db.close();
    return { id: result.lastID, token, expires_at: expiresAt };
  },

  async validateToken(token) {
    const db = await getDb();
    const tokenData = await db.get(
      'SELECT * FROM testimonial_tokens WHERE token = ? AND expires_at > datetime("now") AND used_at IS NULL',
      [token]
    );
    await db.close();
    return tokenData;
  },

  async getTokens(sentBy = null) {
    const db = await getDb();
    let query = 'SELECT * FROM testimonial_tokens ORDER BY created_at DESC';
    let params = [];
    
    if (sentBy) {
      query = 'SELECT * FROM testimonial_tokens WHERE sent_by = ? ORDER BY created_at DESC';
      params = [sentBy];
    }
    
    const tokens = await db.all(query, params);
    await db.close();
    return tokens;
  },

  async deleteToken(token) {
    const db = await getDb();
    await db.run('DELETE FROM testimonial_tokens WHERE token = ?', [token]);
    await db.close();
  },

  async markTokenUsed(token) {
    const db = await getDb();
    await db.run(
      'UPDATE testimonial_tokens SET used_at = datetime("now") WHERE token = ?',
      [token]
    );
    await db.close();
  },

  async createTestimonial(testimonialData) {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO testimonials (client_name, client_email, message, rating, project_type, token_id) VALUES (?, ?, ?, ?, ?, ?)',
      [testimonialData.client_name, testimonialData.client_email, testimonialData.message, testimonialData.rating, testimonialData.project_type, testimonialData.token_id]
    );
    
    await db.close();
    return { id: result.lastID };
  },

  async addTestimonialPhoto(testimonialId, photoData) {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO testimonial_photos (testimonial_id, filename, original_name, file_path, thumbnail_path, file_size, mime_type, width, height, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [testimonialId, photoData.filename, photoData.original_name, photoData.file_path, photoData.thumbnail_path, photoData.file_size, photoData.mime_type, photoData.width, photoData.height, photoData.display_order || 0]
    );
    
    await db.close();
    return { id: result.lastID };
  },

  async getAllTestimonials(visibleOnly = false) {
    const db = await getDb();
    let query = `
      SELECT t.*, 
             GROUP_CONCAT(
               json_object(
                 'id', tp.id,
                 'filename', tp.filename,
                 'file_path', tp.file_path,
                 'thumbnail_path', tp.thumbnail_path
               )
             ) as photos_json
      FROM testimonials t
      LEFT JOIN testimonial_photos tp ON t.id = tp.testimonial_id
    `;
    
    if (visibleOnly) {
      query += ' WHERE t.is_visible = 1';
    }
    
    query += ' GROUP BY t.id ORDER BY t.created_at DESC';
    
    const rows = await db.all(query);
    await db.close();
    
    // Parse photos JSON
    return rows.map(row => ({
      ...row,
      photos: row.photos_json ? 
        row.photos_json.split(',').map(photoJson => JSON.parse(photoJson)).filter(p => p.id) : 
        []
    }));
  },

  async getTestimonialById(id) {
    const db = await getDb();
    const testimonial = await db.get('SELECT * FROM testimonials WHERE id = ?', [id]);
    
    if (testimonial) {
      const photos = await db.all('SELECT * FROM testimonial_photos WHERE testimonial_id = ? ORDER BY display_order', [id]);
      testimonial.photos = photos;
    }
    
    await db.close();
    return testimonial;
  },

  async updateTestimonialVisibility(id, isVisible) {
    const db = await getDb();
    await db.run(
      'UPDATE testimonials SET is_visible = ? WHERE id = ?',
      [isVisible, id]
    );
    await db.close();
  },

  async deleteTestimonial(id) {
    const db = await getDb();
    // Photos will be deleted automatically due to CASCADE
    await db.run('DELETE FROM testimonials WHERE id = ?', [id]);
    await db.close();
  }
};

// Extend analyticsDb with testimonial tracking
const originalAnalyticsDb = analyticsDb;
Object.assign(analyticsDb, {
  async recordTestimonialEvent(eventData) {
    const db = await getDb();
    
    try {
      const result = await db.run(
        `INSERT INTO site_analytics (
          page_path, visitor_ip, visitor_id, referrer, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          eventData.event_type, // Using page_path to store event type like 'testimonial_link_sent', 'testimonial_submitted'
          eventData.ip_address,
          eventData.session_id,
          eventData.metadata, // Using referrer field to store JSON metadata
          eventData.user_agent,
        ]
      );
      
      await db.close();
      return result.lastID;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async getTestimonialStats(dateRange = 30) {
    const db = await getDb();
    
    try {
      // Get testimonial submission stats
      const submissionStats = await db.all(`
        SELECT 
          COUNT(*) as total_submissions,
          AVG(rating) as avg_rating,
          COUNT(CASE WHEN photos.testimonial_id IS NOT NULL THEN 1 END) as submissions_with_photos
        FROM testimonials t
        LEFT JOIN (
          SELECT DISTINCT testimonial_id 
          FROM testimonial_photos
        ) photos ON t.id = photos.testimonial_id
        WHERE t.created_at >= date('now', '-${dateRange} days')
      `);

      // Get testimonial activity by day
      const dailyActivity = await db.all(`
        SELECT 
          date(created_at) as date,
          COUNT(*) as submissions,
          AVG(rating) as avg_rating
        FROM testimonials 
        WHERE created_at >= date('now', '-${dateRange} days')
        GROUP BY date(created_at)
        ORDER BY date DESC
      `);

      // Get rating distribution
      const ratingDistribution = await db.all(`
        SELECT 
          rating,
          COUNT(*) as count
        FROM testimonials 
        WHERE created_at >= date('now', '-${dateRange} days')
        GROUP BY rating
        ORDER BY rating DESC
      `);

      // Get project type breakdown
      const projectTypes = await db.all(`
        SELECT 
          project_type,
          COUNT(*) as count,
          AVG(rating) as avg_rating
        FROM testimonials 
        WHERE created_at >= date('now', '-${dateRange} days')
        AND project_type IS NOT NULL
        GROUP BY project_type
        ORDER BY count DESC
      `);

      // Get testimonial link activity
      const linkActivity = await db.all(`
        SELECT 
          COUNT(*) as links_sent,
          COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as links_used,
          ROUND(
            (COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 2
          ) as conversion_rate
        FROM testimonial_tokens 
        WHERE created_at >= date('now', '-${dateRange} days')
      `);

      await db.close();
      
      return {
        submissions: submissionStats[0] || { total_submissions: 0, avg_rating: 0, submissions_with_photos: 0 },
        daily_activity: dailyActivity,
        rating_distribution: ratingDistribution,
        project_types: projectTypes,
        link_activity: linkActivity[0] || { links_sent: 0, links_used: 0, conversion_rate: 0 }
      };
    } catch (error) {
      await db.close();
      throw error;
    }
  }
});

module.exports = { 
  getDb,
  photoDb, 
  employeeDb, 
  designDb, 
  userDb,
  analyticsDb,
  testimonialDb
};

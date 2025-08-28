const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
// Database connection helper
async function getDb() {
  const db = await open({
    filename: path.join(__dirname, 'database', 'cabinet_photos.db'),
    driver: sqlite3.Database
  });
  return db;
}
var fullpath = path.join(__dirname, 'database', 'cabinet_photos.db');
console.log(fullpath);
fullpath = path.join(__dirname, '..', 'database', 'cabinet_photos.db');
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
    // Use SQLite datetime function instead of JavaScript Date
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days, ISO format

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

    // Get testimonials first
    let testimonialQuery = 'SELECT * FROM testimonials';
    if (visibleOnly) {
      testimonialQuery += ' WHERE is_visible = 1';
    }
    testimonialQuery += ' ORDER BY created_at DESC';

    const testimonials = await db.all(testimonialQuery);

    // Get photos for each testimonial
    for (let testimonial of testimonials) {
      const photos = await db.all(
        'SELECT * FROM testimonial_photos WHERE testimonial_id = ? ORDER BY display_order',
        [testimonial.id]
      );
      testimonial.photos = photos;
    }

    await db.close();
    return testimonials;
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

// Invoice database operations
const invoiceDb = {
  // Client operations
  async getAllClients() {
    const db = await getDb();
    const clients = await db.all('SELECT * FROM clients ORDER BY created_at DESC');
    await db.close();
    return clients;
  },

  async searchClients(searchTerm) {
    const db = await getDb();
    const searchPattern = `%${searchTerm}%`;
    const clients = await db.all(`
      SELECT * FROM clients 
      WHERE 
        company_name LIKE ? OR 
        first_name LIKE ? OR 
        last_name LIKE ? OR 
        email LIKE ? OR 
        phone LIKE ?
      ORDER BY 
        CASE 
          WHEN company_name LIKE ? THEN 1
          WHEN first_name LIKE ? OR last_name LIKE ? THEN 2
          WHEN email LIKE ? THEN 3
          ELSE 4
        END,
        created_at DESC
      LIMIT 20
    `, [
      searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
      searchPattern, searchPattern, searchPattern, searchPattern
    ]);
    await db.close();
    return clients;
  },

  async getClientById(id) {
    const db = await getDb();
    const client = await db.get('SELECT * FROM clients WHERE id = ?', [id]);
    await db.close();
    return client;
  },

  async createClient(clientData) {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO clients (company_name, first_name, last_name, email, phone, address, is_business, tax_exempt_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientData.company_name, clientData.first_name, clientData.last_name, clientData.email, 
       clientData.phone, clientData.address, clientData.is_business || 0, clientData.tax_exempt_number]
    );
    await db.close();
    return { id: result.lastID };
  },

  async updateClient(id, clientData) {
    const db = await getDb();
    await db.run(
      `UPDATE clients SET company_name = ?, first_name = ?, last_name = ?, email = ?, phone = ?, 
       address = ?, is_business = ?, tax_exempt_number = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [clientData.company_name, clientData.first_name, clientData.last_name, clientData.email,
       clientData.phone, clientData.address, clientData.is_business || 0, clientData.tax_exempt_number, id]
    );
    await db.close();
  },

  async deleteClient(id) {
    const db = await getDb();
    try {
      await db.run('BEGIN TRANSACTION');
      
      // Check if client has any invoices
      const invoiceCount = await db.get('SELECT COUNT(*) as count FROM invoices WHERE client_id = ?', [id]);
      if (invoiceCount.count > 0) {
        throw new Error('Cannot delete client with existing invoices. Please delete or reassign invoices first.');
      }
      
      // Delete the client
      const result = await db.run('DELETE FROM clients WHERE id = ?', [id]);
      await db.run('COMMIT');
      
      return { success: true, changes: result.changes };
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    } finally {
      await db.close();
    }
  },

  // Line item label operations (admin configurable)
  async getLineItemLabels() {
    const db = await getDb();
    
    // Check if new columns exist, if not add them
    try {
      await db.exec(`
        ALTER TABLE line_item_labels ADD COLUMN item_type TEXT DEFAULT 'material';
        ALTER TABLE line_item_labels ADD COLUMN description TEXT DEFAULT '';
      `);
    } catch (error) {
      // Columns might already exist, ignore error
    }
    
    const labels = await db.all(`
      SELECT 
        id,
        label_name as label,
        COALESCE(item_type, 'material') as item_type,
        COALESCE(description, '') as description,
        default_unit_price,
        created_at,
        updated_at
      FROM line_item_labels 
      ORDER BY label_name
    `);
    await db.close();
    return labels;
  },

  async createLineItemLabel(labelData) {
    const db = await getDb();
    
    // Ensure new columns exist
    try {
      await db.exec(`
        ALTER TABLE line_item_labels ADD COLUMN item_type TEXT DEFAULT 'material';
        ALTER TABLE line_item_labels ADD COLUMN description TEXT DEFAULT '';
      `);
    } catch (error) {
      // Columns might already exist, ignore error
    }
    
    const result = await db.run(
      'INSERT INTO line_item_labels (label_name, item_type, description, default_unit_price) VALUES (?, ?, ?, ?)',
      [
        labelData.label || labelData.label_name, 
        labelData.item_type || 'material', 
        labelData.description || '', 
        labelData.default_unit_price || 0
      ]
    );
    await db.close();
    return { id: result.lastID };
  },

  async updateLineItemLabel(id, labelData) {
    const db = await getDb();
    
    // Ensure new columns exist
    try {
      await db.exec(`
        ALTER TABLE line_item_labels ADD COLUMN item_type TEXT DEFAULT 'material';
        ALTER TABLE line_item_labels ADD COLUMN description TEXT DEFAULT '';
      `);
    } catch (error) {
      // Columns might already exist, ignore error
    }
    
    await db.run(
      'UPDATE line_item_labels SET label_name = ?, item_type = ?, description = ?, default_unit_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        labelData.label || labelData.label_name, 
        labelData.item_type || 'material',
        labelData.description || '',
        labelData.default_unit_price || 0,
        id
      ]
    );
    await db.close();
  },

  async deleteLineItemLabel(id) {
    const db = await getDb();
    await db.run('DELETE FROM line_item_labels WHERE id = ?', [id]);
    await db.close();
  },

  // Invoice operations
  async getAllInvoices() {
    const db = await getDb();
    const invoices = await db.all(`
      SELECT i.*, c.company_name, c.first_name, c.last_name, c.is_business, c.phone, c.email
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `);
    await db.close();
    return invoices;
  },

  async getInvoiceById(id) {
    const db = await getDb();
    const invoice = await db.get(`
      SELECT i.*, c.* 
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `, [id]);

    if (invoice) {
      // Get line items
      invoice.line_items = await db.all(
        'SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY line_order',
        [id]
      );

      // Get payments
      invoice.payments = await db.all(
        'SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date DESC',
        [id]
      );
    }

    await db.close();
    return invoice;
  },

  async createInvoice(invoiceData) {
    const db = await getDb();
    
    try {
      await db.run('BEGIN TRANSACTION');

      // Generate unique invoice number
      const invoiceNumber = await this.generateInvoiceNumber(db);

      // Create invoice
      const invoiceResult = await db.run(`
        INSERT INTO invoices (
          client_id, invoice_number, invoice_date, due_date, status, 
          subtotal, tax_rate, tax_amount, discount_amount, markup_amount, 
          total_amount, logo_url, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceData.client_id, invoiceNumber, invoiceData.invoice_date, invoiceData.due_date, 
         invoiceData.status || 'draft', invoiceData.subtotal, invoiceData.tax_rate, 
         invoiceData.tax_amount, invoiceData.discount_amount || 0, invoiceData.markup_amount || 0, 
         invoiceData.total_amount, invoiceData.logo_url, invoiceData.notes]
      );

      const invoiceId = invoiceResult.lastID;

      // Create line items
      if (invoiceData.line_items && invoiceData.line_items.length > 0) {
        for (let i = 0; i < invoiceData.line_items.length; i++) {
          const item = invoiceData.line_items[i];
          await db.run(`
            INSERT INTO invoice_line_items (
              invoice_id, description, quantity, unit_price, total_price, item_type, line_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [invoiceId, item.description, item.quantity, item.unit_price, 
             item.total_price, item.item_type || 'material', i]
          );
        }
      }

      // Generate persistent token
      const token = crypto.randomBytes(32).toString('hex');
      await db.run(
        'INSERT INTO invoice_tokens (token, invoice_id) VALUES (?, ?)',
        [token, invoiceId]
      );

      await db.run('COMMIT');
      await db.close();
      
      return { id: invoiceId, invoice_number: invoiceNumber, token };
    } catch (error) {
      await db.run('ROLLBACK');
      await db.close();
      throw error;
    }
  },

  async generateInvoiceNumber(db) {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    
    const lastInvoice = await db.get(
      'SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1',
      [`${prefix}%`]
    );
    
    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  },

  // Token operations for client access
  async getInvoiceByToken(token) {
    const db = await getDb();
    
    const tokenData = await db.get(`
      SELECT t.*, i.*, c.*
      FROM invoice_tokens t
      JOIN invoices i ON t.invoice_id = i.id
      JOIN clients c ON i.client_id = c.id
      WHERE t.token = ? AND t.is_active = 1
    `, [token]);

    if (tokenData) {
      // Update view count and last viewed
      await db.run(
        'UPDATE invoice_tokens SET viewed_at = CURRENT_TIMESTAMP, view_count = view_count + 1 WHERE token = ?',
        [token]
      );

      // Get line items
      tokenData.line_items = await db.all(
        'SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY line_order',
        [tokenData.invoice_id]
      );

      // Get payments
      tokenData.payments = await db.all(
        'SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date DESC',
        [tokenData.invoice_id]
      );
    }

    await db.close();
    return tokenData;
  },

  async createInvoiceToken(invoiceId) {
    const db = await getDb();
    
    try {
      // Check if token already exists
      const existingToken = await db.get(
        'SELECT token FROM invoice_tokens WHERE invoice_id = ? AND is_active = 1',
        [invoiceId]
      );
      
      if (existingToken) {
        await db.close();
        return { token: existingToken.token };
      }
      
      // Generate new token
      const token = crypto.randomBytes(32).toString('hex');
      await db.run(
        'INSERT INTO invoice_tokens (token, invoice_id) VALUES (?, ?)',
        [token, invoiceId]
      );
      
      await db.close();
      return { token };
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async getInvoiceByNumber(invoiceNumber) {
    const db = await getDb();
    const invoice = await db.get('SELECT * FROM invoices WHERE invoice_number = ?', [invoiceNumber]);
    await db.close();
    return invoice;
  },

  async updateInvoiceNumber(invoiceId, newInvoiceNumber, updatedBy) {
    const db = await getDb();
    
    try {
      const result = await db.run(
        'UPDATE invoices SET invoice_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newInvoiceNumber, invoiceId]
      );
      
      await db.close();
      return { success: true, changes: result.changes };
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async updateInvoice(invoiceId, updateData) {
    const db = await getDb();
    
    try {
      await db.run('BEGIN TRANSACTION');

      // Update invoice basic fields
      const invoiceFields = [
        'client_id', 'invoice_date', 'due_date', 'discount_amount', 
        'markup_amount', 'tax_rate', 'notes', 'status'
      ];
      
      const updateFields = [];
      const updateValues = [];
      
      invoiceFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });
      
      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(invoiceId);
        
        await db.run(
          `UPDATE invoices SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      // Update line items if provided
      if (updateData.line_items) {
        // Delete existing line items
        await db.run('DELETE FROM invoice_line_items WHERE invoice_id = ?', [invoiceId]);
        
        // Insert new line items
        for (let i = 0; i < updateData.line_items.length; i++) {
          const item = updateData.line_items[i];
          await db.run(`
            INSERT INTO invoice_line_items (
              invoice_id, label_id, description, quantity, unit_price, notes, line_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            invoiceId,
            item.label_id || null,
            item.description,
            item.quantity,
            item.unit_price,
            item.notes || '',
            i + 1
          ]);
        }
      }

      // Recalculate totals
      const lineItemsResult = await db.all(
        'SELECT quantity, unit_price FROM invoice_line_items WHERE invoice_id = ?',
        [invoiceId]
      );
      
      const subtotal = lineItemsResult.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price));
      }, 0);
      
      const discountAmount = parseFloat(updateData.discount_amount || 0);
      const markupAmount = parseFloat(updateData.markup_amount || 0);
      const taxRate = parseFloat(updateData.tax_rate || 0);
      
      const afterDiscount = subtotal - discountAmount;
      const afterMarkup = afterDiscount + markupAmount;
      const taxAmount = afterMarkup * (taxRate / 100);
      const totalAmount = afterMarkup + taxAmount;

      // Update calculated totals
      await db.run(`
        UPDATE invoices 
        SET subtotal_amount = ?, tax_amount = ?, total_amount = ?
        WHERE id = ?
      `, [subtotal, taxAmount, totalAmount, invoiceId]);

      await db.run('COMMIT');
      
      // Return updated invoice
      const updatedInvoice = await this.getInvoiceById(invoiceId);
      await db.close();
      
      return updatedInvoice;
    } catch (error) {
      await db.run('ROLLBACK');
      await db.close();
      throw error;
    }
  },

  async deleteInvoice(invoiceId, deletedBy) {
    const db = await getDb();
    
    try {
      await db.run('BEGIN TRANSACTION');
      
      // Delete related records first (in correct order to avoid foreign key constraints)
      await db.run('DELETE FROM invoice_line_items WHERE invoice_id = ?', [invoiceId]);
      await db.run('DELETE FROM invoice_payments WHERE invoice_id = ?', [invoiceId]);
      await db.run('DELETE FROM invoice_tokens WHERE invoice_id = ?', [invoiceId]);
      
      // Finally delete the invoice
      const result = await db.run('DELETE FROM invoices WHERE id = ?', [invoiceId]);
      
      await db.run('COMMIT');
      await db.close();
      
      return { success: true, changes: result.changes };
    } catch (error) {
      await db.run('ROLLBACK');
      await db.close();
      throw error;
    }
  },

  // Tax rate management
  async findTaxRate(stateCode, county, city) {
    const db = await getDb();
    const taxRate = await db.get(`
      SELECT * FROM tax_rates 
      WHERE state_code = ? AND 
            COALESCE(county, '') = ? AND 
            COALESCE(city, '') = ? AND 
            is_active = 1
    `, [stateCode.toUpperCase(), county || '', city || '']);
    await db.close();
    return taxRate;
  },

  async getTaxRateById(id) {
    const db = await getDb();
    const taxRate = await db.get('SELECT * FROM tax_rates WHERE id = ?', [id]);
    await db.close();
    return taxRate;
  },

  async createTaxRate(taxRateData) {
    const db = await getDb();
    const result = await db.run(`
      INSERT INTO tax_rates (state_code, county, city, tax_rate, description, updated_by) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      taxRateData.state_code,
      taxRateData.county,
      taxRateData.city,
      taxRateData.tax_rate,
      taxRateData.description,
      taxRateData.updated_by
    ]);
    await db.close();
    return { id: result.lastID };
  },

  async updateTaxRate(id, taxRateData) {
    const db = await getDb();
    const result = await db.run(`
      UPDATE tax_rates 
      SET state_code = ?, county = ?, city = ?, tax_rate = ?, description = ?, 
          is_active = ?, updated_by = ?, last_updated = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [
      taxRateData.state_code,
      taxRateData.county,
      taxRateData.city,
      taxRateData.tax_rate,
      taxRateData.description,
      taxRateData.is_active,
      taxRateData.updated_by,
      id
    ]);
    await db.close();
    return { changes: result.changes };
  },

  async deleteTaxRate(id) {
    const db = await getDb();
    const result = await db.run('DELETE FROM tax_rates WHERE id = ?', [id]);
    await db.close();
    return { changes: result.changes };
  },

  async isTaxRateInUse(taxRateId) {
    const db = await getDb();
    const taxRate = await db.get('SELECT tax_rate FROM tax_rates WHERE id = ?', [taxRateId]);
    if (!taxRate) {
      await db.close();
      return false;
    }
    
    const invoice = await db.get('SELECT id FROM invoices WHERE tax_rate = ? LIMIT 1', [taxRate.tax_rate]);
    await db.close();
    return !!invoice;
  },

  async getAllTaxRates() {
    const db = await getDb();
    const taxRates = await db.all(`
      SELECT * FROM tax_rates 
      ORDER BY state_code, city, county, is_active DESC
    `);
    await db.close();
    return taxRates;
  },

  // Payment tracking
  async addPayment(paymentData) {
    const db = await getDb();
    const result = await db.run(`
      INSERT INTO invoice_payments (
        invoice_id, payment_amount, payment_method, check_number, payment_date, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paymentData.invoice_id, paymentData.payment_amount, paymentData.payment_method,
       paymentData.check_number, paymentData.payment_date, paymentData.notes, paymentData.created_by]
    );

    // Update invoice status if fully paid
    await this.updateInvoiceStatus(paymentData.invoice_id);
    
    await db.close();
    return { id: result.lastID };
  },

  async updateInvoiceStatus(invoiceId) {
    const db = await getDb();
    
    const invoice = await db.get('SELECT total_amount FROM invoices WHERE id = ?', [invoiceId]);
    const paymentsResult = await db.get(
      'SELECT SUM(payment_amount) as total_paid FROM invoice_payments WHERE invoice_id = ?',
      [invoiceId]
    );
    
    const totalPaid = paymentsResult.total_paid || 0;
    let status = 'draft';
    
    if (totalPaid >= invoice.total_amount) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    } else {
      status = 'sent';
    }
    
    await db.run('UPDATE invoices SET status = ? WHERE id = ?', [status, invoiceId]);
    await db.close();
  },

  // Tax rate operations
  async getTaxRates() {
    const db = await getDb();
    const rates = await db.all('SELECT * FROM tax_rates WHERE is_active = 1 ORDER BY state_code, county, city');
    await db.close();
    return rates;
  },

  async updateTaxRate(id, taxData) {
    const db = await getDb();
    await db.run(
      'UPDATE tax_rates SET tax_rate = ?, last_updated = CURRENT_TIMESTAMP, updated_by = ? WHERE id = ?',
      [taxData.tax_rate, taxData.updated_by, id]
    );
    await db.close();
  }
};

module.exports = {
  getDb,
  photoDb,
  employeeDb,
  designDb,
  userDb,
  analyticsDb,
  testimonialDb,
  invoiceDb
};

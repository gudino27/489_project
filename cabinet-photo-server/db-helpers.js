const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Queue for database operations to prevent SQLITE_BUSY errors
const dbOperationQueue = [];
let isProcessingQueue = false;

// Database connection helper
async function getDb() {
  const db = await open({
    filename: path.join(__dirname, 'database', 'cabinet_photos.db'),
    driver: sqlite3.Database
  });

  // Enable WAL mode for better concurrency
  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA busy_timeout = 10000;'); // 10 second timeout

  return db;
}

// Queue database operations to prevent SQLITE_BUSY errors
async function queueDbOperation(operation) {
  return new Promise((resolve, reject) => {
    dbOperationQueue.push({ operation, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue || dbOperationQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (dbOperationQueue.length > 0) {
    const { operation, resolve, reject } = dbOperationQueue.shift();

    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    }

    // Small delay to prevent overwhelming the database
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  isProcessingQueue = false;
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
      // Hash password with 12 salt rounds (increased from 10)
      const hashedPassword = await bcrypt.hash(password, 12);

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
  async authenticateUser(username, password, ipAddress = null, userAgent = null) {
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

      // Check if account is locked
      if (user.account_locked_until) {
        const lockUntil = new Date(user.account_locked_until);
        if (lockUntil > new Date()) {
          await db.close();
          return {
            locked: true,
            lockedUntil: lockUntil,
            message: `Account is locked until ${lockUntil.toLocaleString()}`
          };
        } else {
          // Unlock account if lock period has expired
          await db.run(
            'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?',
            [user.id]
          );
        }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        // Increment failed login attempts
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        const maxAttempts = 5;

        if (failedAttempts >= maxAttempts) {
          // Lock account for 15 minutes
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          await db.run(
            'UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?',
            [failedAttempts, lockUntil.toISOString(), user.id]
          );

          // Log failed login attempt
          await db.run(
            `INSERT INTO activity_logs (user_id, user_name, action, details, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              user.id,
              user.full_name || user.username,
              'account_locked',
              `Account locked after ${failedAttempts} failed login attempts`,
              ipAddress,
              userAgent
            ]
          );

          await db.close();
          return {
            locked: true,
            lockedUntil: lockUntil,
            message: `Account locked for 15 minutes after ${maxAttempts} failed attempts`
          };
        }

        await db.run(
          'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
          [failedAttempts, user.id]
        );

        // Log failed login attempt
        await db.run(
          `INSERT INTO activity_logs (user_id, user_name, action, details, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            user.full_name || user.username,
            'login_failed',
            `Failed login attempt (${failedAttempts}/${maxAttempts})`,
            ipAddress,
            userAgent
          ]
        );

        await db.close();
        return null;
      }

      // Reset failed login attempts on successful login
      await db.run(
        'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?',
        [user.id]
      );

      // Generate session token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours (increased from 30 min)

      // Save session with IP and user agent
      await db.run(
        `INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent, last_activity)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [user.id, token, expiresAt.toISOString(), ipAddress, userAgent]
      );

      // Update last login
      await db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      // Log successful login
      await db.run(
        `INSERT INTO activity_logs (user_id, user_name, action, details, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.full_name || user.username,
          'login_success',
          'User logged in successfully',
          ipAddress,
          userAgent
        ]
      );

      await db.close();

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          must_change_password: user.must_change_password
        }
      };
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Validate session token with rotation support
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
        const now = new Date();
        const expiresAt = new Date(session.expires_at);
        const lastActivity = session.last_activity ? new Date(session.last_activity) : new Date(session.created_at);

        // Session token rotation: rotate token if last activity was more than 1 hour ago
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        let newToken = null;

        if (lastActivity < oneHourAgo) {
          // Generate new token
          newToken = crypto.randomBytes(32).toString('hex');
          const newExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

          // Delete old session and create new one
          await db.run('DELETE FROM user_sessions WHERE token = ?', [token]);
          await db.run(
            `INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent, last_activity)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [session.user_id, newToken, newExpiresAt.toISOString(), session.ip_address, session.user_agent]
          );
        } else {
          // Just update last activity
          await db.run(
            'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE token = ?',
            [token]
          );
        }

        await db.close();

        return {
          user: {
            id: session.id,
            username: session.username,
            email: session.email,
            role: session.role,
            full_name: session.full_name
          },
          newToken: newToken // Will be null if token wasn't rotated
        };
      }

      await db.close();
      return null;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Invalidate session (logout)
  async invalidateSession(token) {
    const db = await getDb();

    try {
      // Get session info for logging before deleting
      const session = await db.get(`
        SELECT s.*, u.full_name, u.username
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?
      `, [token]);

      if (session) {
        // Log logout activity
        await db.run(
          `INSERT INTO activity_logs (user_id, user_name, action, details, ip_address, user_agent)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            session.user_id,
            session.full_name || session.username,
            'logout',
            'User logged out',
            session.ip_address,
            session.user_agent
          ]
        );

        // Delete the session
        await db.run('DELETE FROM user_sessions WHERE token = ?', [token]);
      }

      await db.close();
      return true;
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

  // Get user by email
  async getUserByEmail(email) {
    const db = await getDb();
    try {
      const user = await db.get(
        'SELECT id, username, email, role, full_name, is_active FROM users WHERE email = ?',
        [email]
      );
      await db.close();
      return user;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Get user by phone (for invitation system)
  async getUserByPhone(phone) {
    const db = await getDb();
    try {
      const user = await db.get(
        'SELECT id, username, email, role, full_name, is_active FROM users WHERE phone = ?',
        [phone]
      );
      await db.close();
      return user;
    } catch (error) {
      await db.close();
      throw error;
    }
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

      // Hash new password with 12 salt rounds
      const hashedPassword = await bcrypt.hash(newPassword, 12);

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

  // Log user activity for audit trail
  async logActivity(activityData) {
    const db = await getDb();
    const { userId, userName, action, resourceType, resourceId, details, ipAddress, userAgent, metadata } = activityData;

    try {
      await db.run(
        `INSERT INTO activity_logs (user_id, user_name, action, resource_type, resource_id, details, ip_address, user_agent, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, userName, action, resourceType, resourceId, details, ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null]
      );
      await db.close();
      return true;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Get activity logs with optional filters
  async getActivityLogs(filters = {}) {
    const db = await getDb();
    const { userId, action, limit = 100, offset = 0 } = filters;

    try {
      let query = 'SELECT * FROM activity_logs WHERE 1=1';
      const params = [];

      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      if (action) {
        query += ' AND action = ?';
        params.push(action);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const logs = await db.all(query, params);
      await db.close();
      return logs;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Get failed login attempts for monitoring
  async getFailedLoginAttempts(hoursAgo = 24) {
    const db = await getDb();

    try {
      const logs = await db.all(`
        SELECT * FROM activity_logs
        WHERE action IN ('login_failed', 'account_locked')
          AND created_at > datetime('now', '-${hoursAgo} hours')
        ORDER BY created_at DESC
      `);
      await db.close();
      return logs;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Get currently locked accounts
  async getLockedAccounts() {
    const db = await getDb();

    try {
      const accounts = await db.all(`
        SELECT id, username, email, full_name, failed_login_attempts, account_locked_until
        FROM users
        WHERE account_locked_until > datetime('now')
        ORDER BY account_locked_until DESC
      `);
      await db.close();
      return accounts;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Manually unlock an account (admin action)
  async unlockAccount(userId, adminId, adminName) {
    const db = await getDb();

    try {
      await db.run(
        'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?',
        [userId]
      );

      // Log the unlock action
      await db.run(
        `INSERT INTO activity_logs (user_id, user_name, action, resource_type, resource_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [adminId, adminName, 'account_unlocked', 'user', userId, `Admin manually unlocked account`]
      );

      await db.close();
      return true;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Create refresh token for mobile app
  async createRefreshToken(userId, deviceId, deviceType, ipAddress = null, userAgent = null) {
    const db = await getDb();

    try {
      // Generate secure refresh token
      const refreshToken = crypto.randomBytes(64).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.run(
        `INSERT INTO refresh_tokens (user_id, token, device_id, device_type, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, refreshToken, deviceId, deviceType, expiresAt.toISOString(), ipAddress, userAgent]
      );

      await db.close();
      return refreshToken;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Validate refresh token and return user info
  async validateRefreshToken(refreshToken) {
    const db = await getDb();

    try {
      const tokenData = await db.get(`
        SELECT rt.*, u.id as user_id, u.username, u.email, u.role, u.full_name
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token = ?
          AND rt.is_revoked = 0
          AND rt.expires_at > datetime('now')
          AND u.is_active = 1
      `, [refreshToken]);

      await db.close();
      return tokenData;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Revoke refresh token (logout from specific device)
  async revokeRefreshToken(refreshToken) {
    const db = await getDb();

    try {
      await db.run(
        `UPDATE refresh_tokens
         SET is_revoked = 1, revoked_at = CURRENT_TIMESTAMP
         WHERE token = ?`,
        [refreshToken]
      );

      await db.close();
      return true;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Revoke all refresh tokens for a user (logout from all devices)
  async revokeAllRefreshTokens(userId) {
    const db = await getDb();

    try {
      await db.run(
        `UPDATE refresh_tokens
         SET is_revoked = 1, revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND is_revoked = 0`,
        [userId]
      );

      await db.close();
      return true;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Clean up expired refresh tokens (run periodically)
  async cleanupExpiredRefreshTokens() {
    const db = await getDb();

    try {
      const result = await db.run(
        `DELETE FROM refresh_tokens
         WHERE expires_at < datetime('now', '-7 days')`
      );

      await db.close();
      return result.changes;
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

  async getTokens(sentBy = null, status = null) {
    const db = await getDb();
    let query = 'SELECT * FROM testimonial_tokens';
    let params = [];
    let conditions = [];

    if (sentBy) {
      conditions.push('sent_by = ?');
      params.push(sentBy);
    }

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

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
      'UPDATE testimonial_tokens SET used_at = datetime("now"), status = ? WHERE token = ?',
      ['submitted', token]
    );
    await db.close();
  },

  async trackLinkOpen(token, trackingData) {
    const db = await getDb();

    // Insert tracking record (city-level only for privacy compliance)
    await db.run(
      `INSERT INTO testimonial_link_tracking
       (token, ip_address, user_agent, referer, city, region, country, country_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        token,
        trackingData.ip_address,
        trackingData.user_agent,
        trackingData.referer,
        trackingData.city,
        trackingData.region,
        trackingData.country,
        trackingData.country_code
      ]
    );

    // Update token with tracking info
    const tokenInfo = await db.get(
      'SELECT opened_count, first_opened_at FROM testimonial_tokens WHERE token = ?',
      [token]
    );

    if (tokenInfo) {
      const isFirstOpen = !tokenInfo.first_opened_at;
      const newCount = (tokenInfo.opened_count || 0) + 1;

      if (isFirstOpen) {
        await db.run(
          `UPDATE testimonial_tokens
           SET opened_count = ?, first_opened_at = datetime("now"), last_opened_at = datetime("now"), status = ?
           WHERE token = ?`,
          [newCount, 'opened', token]
        );
      } else {
        await db.run(
          `UPDATE testimonial_tokens
           SET opened_count = ?, last_opened_at = datetime("now")
           WHERE token = ?`,
          [newCount, token]
        );
      }
    }

    await db.close();
  },

  async getTokenTracking(token, limit = 20, offset = 0) {
    const db = await getDb();

    // Get tracking records with pagination
    const trackingRecords = await db.all(
      `SELECT * FROM testimonial_link_tracking
       WHERE token = ?
       ORDER BY opened_at DESC
       LIMIT ? OFFSET ?`,
      [token, limit, offset]
    );

    // Get total count for pagination
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM testimonial_link_tracking WHERE token = ?',
      [token]
    );

    await db.close();

    return {
      records: trackingRecords,
      total: countResult.total,
      hasMore: (offset + limit) < countResult.total
    };
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

  async findClientByEmailOrPhone(email, phone) {
    const db = await getDb();
    const client = await db.get(`
      SELECT * FROM clients 
      WHERE (email = ? AND email IS NOT NULL AND email != '') 
         OR (phone = ? AND phone IS NOT NULL AND phone != '')
      LIMIT 1
    `, [email, phone]);
    await db.close();
    return client;
  },

  async getInvoicesByClientId(clientId) {
    const db = await getDb();
    const invoices = await db.all(`
      SELECT 
        i.*,
        COALESCE(p.total_paid, 0) as total_paid
      FROM invoices i
      LEFT JOIN (
        SELECT invoice_id, SUM(payment_amount) as total_paid
        FROM invoice_payments
        GROUP BY invoice_id
      ) p ON i.id = p.invoice_id
      WHERE i.client_id = ?
      ORDER BY i.created_at DESC
    `, [clientId]);
    await db.close();
    return invoices;
  },

  // Invoice reminder operations
  async getReminderSettings(invoiceId) {
    const db = await getDb();
    const settings = await db.get(`
      SELECT * FROM invoice_reminder_settings 
      WHERE invoice_id = ?
    `, [invoiceId]);
    await db.close();
    return settings;
  },

  async updateReminderSettings(invoiceId, settings) {
    const db = await getDb();
    const result = await db.run(`
      INSERT OR REPLACE INTO invoice_reminder_settings 
      (invoice_id, reminders_enabled, reminder_days, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [invoiceId, settings.reminders_enabled, settings.reminder_days]);
    await db.close();
    return { id: result.lastID };
  },

  async getInvoicesNeedingReminders() {
    const db = await getDb();
    const invoices = await db.all(`
      SELECT 
        i.*,
        c.company_name, c.first_name, c.last_name, c.is_business, c.phone, c.email,
        rs.reminders_enabled, rs.reminder_days, rs.last_reminder_sent_at,
        COALESCE(p.total_paid, 0) as total_paid,
        JULIANDAY('now') - JULIANDAY(i.due_date) as days_overdue
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      LEFT JOIN invoice_reminder_settings rs ON i.id = rs.invoice_id
      LEFT JOIN (
        SELECT invoice_id, SUM(payment_amount) as total_paid
        FROM invoice_payments
        GROUP BY invoice_id
      ) p ON i.id = p.invoice_id
      WHERE rs.reminders_enabled = 1
        AND i.status != 'paid'
        AND JULIANDAY('now') > JULIANDAY(i.due_date)
        AND (COALESCE(p.total_paid, 0) < i.total_amount)
      ORDER BY days_overdue DESC
    `);
    await db.close();
    return invoices;
  },

  async logReminder(reminderData) {
    const db = await getDb();
    const result = await db.run(`
      INSERT INTO invoice_reminders 
      (invoice_id, reminder_type, days_overdue, sent_by, message, successful)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      reminderData.invoice_id,
      reminderData.reminder_type,
      reminderData.days_overdue,
      reminderData.sent_by,
      reminderData.message,
      reminderData.successful
    ]);

    // Update last reminder sent timestamp
    await db.run(`
      UPDATE invoice_reminder_settings 
      SET last_reminder_sent_at = CURRENT_TIMESTAMP 
      WHERE invoice_id = ?
    `, [reminderData.invoice_id]);

    await db.close();
    return { id: result.lastID };
  },

  async getReminderHistory(invoiceId) {
    const db = await getDb();
    const reminders = await db.all(`
      SELECT 
        r.*,
        u.username as sent_by_username
      FROM invoice_reminders r
      LEFT JOIN users u ON r.sent_by = u.id
      WHERE r.invoice_id = ?
      ORDER BY r.sent_at DESC
    `, [invoiceId]);
    await db.close();
    return reminders;
  },

  // Line item label operations (admin configurable)
  async getLineItemLabels() {
    const db = await getDb();

    const labels = await db.all(`
      SELECT
        id,
        label_name as label,
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

    const result = await db.run(
      'INSERT INTO line_item_labels (label_name, default_unit_price) VALUES (?, ?)',
      [
        labelData.label || labelData.label_name,
        labelData.default_unit_price || 0
      ]
    );
    await db.close();
    return { id: result.lastID };
  },

  async updateLineItemLabel(id, labelData) {
    const db = await getDb();

    await db.run(
      'UPDATE line_item_labels SET label_name = ?, default_unit_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        labelData.label || labelData.label_name,
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

  async migrateLineItemLabelsTable() {
    const db = await getDb();
    try {
      // Check if we need to migrate (if description or item_type columns exist)
      const tableInfo = await db.all("PRAGMA table_info(line_item_labels)");
      const hasDescription = tableInfo.some(col => col.name === 'description');
      const hasItemType = tableInfo.some(col => col.name === 'item_type');

      if (hasDescription || hasItemType) {
        console.log('Migrating line_item_labels table to remove description and item_type columns...');

        // Create new table with only the columns we want
        await db.exec(`
          CREATE TABLE line_item_labels_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label_name TEXT NOT NULL UNIQUE,
            default_unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Copy data from old table to new table
        await db.exec(`
          INSERT INTO line_item_labels_new (id, label_name, default_unit_price, created_at, updated_at)
          SELECT id, label_name, default_unit_price, created_at, updated_at
          FROM line_item_labels
        `);

        // Drop old table and rename new table
        await db.exec(`DROP TABLE line_item_labels`);
        await db.exec(`ALTER TABLE line_item_labels_new RENAME TO line_item_labels`);

        console.log('Migration completed: removed description and item_type columns from line_item_labels');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await db.close();
    }
  },

  async fixTaxRatePrecision() {
    const db = await getDb();
    try {
      console.log('Fixing tax rate floating point precision issues...');

      // Get all tax rates
      const taxRates = await db.all('SELECT id, tax_rate, city, state_code FROM tax_rates');

      let fixedCount = 0;
      for (const rate of taxRates) {
        const originalRate = rate.tax_rate;
        const roundedRate = Math.round(originalRate * 10000) / 10000;

        // Only update if there's a difference (precision issue)
        if (Math.abs(originalRate - roundedRate) > 0.000001) {
          await db.run('UPDATE tax_rates SET tax_rate = ? WHERE id = ?', [roundedRate, rate.id]);
          console.log(`Fixed tax rate ID ${rate.id} (${rate.city || rate.state_code}): ${originalRate} → ${roundedRate}`);
          fixedCount++;
        }
      }

      // Special fix for known problematic rate (SUNNYSIDE should be exactly 0.097)
      const sunnysideRate = taxRates.find(r => r.city && r.city.toLowerCase() === 'sunnyside');
      if (sunnysideRate && Math.abs(sunnysideRate.tax_rate - 0.097) < 0.001) {
        await db.run('UPDATE tax_rates SET tax_rate = ? WHERE id = ?', [0.097, sunnysideRate.id]);
        console.log(`Special fix for SUNNYSIDE: ${sunnysideRate.tax_rate} → 0.097`);
        fixedCount++;
      }

      if (fixedCount > 0) {
        console.log(`Fixed ${fixedCount} tax rates with precision issues`);
      } else {
        console.log('No tax rate precision issues found');
      }
    } catch (error) {
      console.error('Tax rate precision fix failed:', error);
      throw error;
    } finally {
      await db.close();
    }
  },

  async convertTaxRatesToPercentages() {
    const db = await getDb();
    try {
      console.log('Converting tax rates from decimals to percentages...');

      // Get all tax rates that look like decimals (less than 1)
      const taxRates = await db.all('SELECT id, tax_rate, city, state_code FROM tax_rates WHERE tax_rate < 1');

      let convertedCount = 0;
      for (const rate of taxRates) {
        const originalRate = rate.tax_rate;
        const percentageRate = Math.round(originalRate * 100 * 100) / 100; // Convert to percentage and round to 2 decimals

        await db.run('UPDATE tax_rates SET tax_rate = ? WHERE id = ?', [percentageRate, rate.id]);
        console.log(`Converted tax rate ID ${rate.id} (${rate.city || rate.state_code}): ${originalRate} → ${percentageRate}%`);
        convertedCount++;
      }

      if (convertedCount > 0) {
        console.log(`Converted ${convertedCount} tax rates from decimals to percentages`);
      } else {
        console.log('No decimal tax rates found to convert');
      }
    } catch (error) {
      console.error('Tax rate conversion failed:', error);
      throw error;
    } finally {
      await db.close();
    }
  },

  // Invoice operations
  async getAllInvoices() {
    const db = await getDb();
    const invoices = await db.all(`
      SELECT
        i.*,
        c.company_name, c.first_name, c.last_name, c.is_business, c.phone, c.email,
        COALESCE(p.total_paid, 0) as total_paid,
        t.token as access_token
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      LEFT JOIN (
        SELECT invoice_id, SUM(payment_amount) as total_paid
        FROM invoice_payments
        GROUP BY invoice_id
      ) p ON i.id = p.invoice_id
      LEFT JOIN invoice_tokens t ON i.id = t.invoice_id AND t.is_active = 1
      ORDER BY i.created_at DESC
    `);

    // Calculate payment status for each invoice and ensure balance_due is accurate
    const invoicesWithStatus = invoices.map(invoice => {
      const totalPaid = parseFloat(invoice.total_paid || 0);
      const totalAmount = parseFloat(invoice.total_amount || 0);
      // Use database balance_due if available, otherwise calculate it
      const balanceDue = invoice.balance_due !== null && invoice.balance_due !== undefined
        ? parseFloat(invoice.balance_due)
        : Math.max(0, totalAmount - totalPaid);

      let paymentStatus;
      if (totalPaid >= totalAmount) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      } else {
        paymentStatus = 'unpaid';
      }

      // Update status if needed based on payment status and due date
      const dueDate = new Date(invoice.due_date);
      const today = new Date();

      if (paymentStatus !== 'paid' && dueDate < today) {
        invoice.status = 'overdue';
      } else if (paymentStatus === 'paid') {
        invoice.status = 'paid';
      } else if (paymentStatus === 'partial' || paymentStatus === 'unpaid') {
        invoice.status = invoice.status || 'pending';
      }

      return {
        ...invoice,
        payment_status: paymentStatus,
        balance_due: balanceDue.toFixed(2)
      };
    });

    await db.close();
    return invoicesWithStatus;
  },

  async getInvoiceById(id) {
    const db = await getDb();
    const invoice = await db.get(`
      SELECT i.*,
             c.company_name, c.first_name, c.last_name, c.email, c.phone, c.address, c.is_business, c.tax_exempt_number,
             t.token as access_token
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      LEFT JOIN invoice_tokens t ON i.id = t.invoice_id AND t.is_active = 1
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
          total_amount, logo_url, notes, client_notes, admin_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceData.client_id, invoiceNumber, invoiceData.invoice_date, invoiceData.due_date,
         invoiceData.status || 'draft', invoiceData.subtotal, invoiceData.tax_rate,
         invoiceData.tax_amount, invoiceData.discount_amount || 0, invoiceData.markup_amount || 0,
         invoiceData.total_amount, invoiceData.logo_url, invoiceData.notes || null,
         invoiceData.client_notes || null, invoiceData.admin_notes || null]
      );

      const invoiceId = invoiceResult.lastID;

      // Create line items
      if (invoiceData.line_items && invoiceData.line_items.length > 0) {
        for (let i = 0; i < invoiceData.line_items.length; i++) {
          const item = invoiceData.line_items[i];
          await db.run(`
            INSERT INTO invoice_line_items (
              invoice_id, title, description, quantity, unit_price, total_price, item_type, line_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [invoiceId, item.title || null, item.description, item.quantity, item.unit_price,
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
    
    // Count existing invoices for this year to get the next sequential number
    const count = await db.get(
      'SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?',
      [`${prefix}%`]
    );
    
    const nextNumber = (count.count || 0) + 1;
    
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  },

  // Token operations for client access
  async getInvoiceByToken(token) {
    const db = await getDb();

    const tokenData = await db.get(`
      SELECT
        i.id as invoice_id,
        i.invoice_number, i.invoice_date, i.due_date, i.status, i.subtotal, i.tax_rate,
        i.tax_amount, i.discount_amount, i.markup_amount, i.total_amount, i.logo_url,
        i.notes, i.created_at as invoice_created_at, i.updated_at, i.balance_due,
        c.id as client_id,
        c.company_name, c.first_name, c.last_name, c.email, c.phone, c.address, c.is_business, c.tax_exempt_number,
        t.token, t.viewed_at as token_viewed_at, t.view_count, t.created_at as token_created_at
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
        'markup_amount', 'tax_rate', 'notes', 'client_notes', 'admin_notes', 'status'
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
          const totalPrice = (item.quantity || 0) * (item.unit_price || 0);
          await db.run(`
            INSERT INTO invoice_line_items (
              invoice_id, title, description, quantity, unit_price, total_price, item_type, line_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            invoiceId,
            item.title || null,
            item.description,
            item.quantity,
            item.unit_price,
            totalPrice,
            item.item_type || 'material',
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
        SET subtotal = ?, tax_amount = ?, total_amount = ?
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
      
      // Get the invoice being deleted to know its year
      const invoice = await db.get('SELECT invoice_number FROM invoices WHERE id = ?', [invoiceId]);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      const year = invoice.invoice_number.split('-')[1];
      
      // Delete related records first (in correct order to avoid foreign key constraints)
      await db.run('DELETE FROM invoice_line_items WHERE invoice_id = ?', [invoiceId]);
      await db.run('DELETE FROM invoice_payments WHERE invoice_id = ?', [invoiceId]);
      await db.run('DELETE FROM invoice_tokens WHERE invoice_id = ?', [invoiceId]);
      await db.run('DELETE FROM invoice_reminders WHERE invoice_id = ?', [invoiceId]);
      
      // Finally delete the invoice
      const result = await db.run('DELETE FROM invoices WHERE id = ?', [invoiceId]);
      
      // Renumber remaining invoices for this year
      await this.renumberInvoicesForYear(db, year);
      
      await db.run('COMMIT');
      await db.close();
      
      return { success: true, changes: result.changes };
    } catch (error) {
      await db.run('ROLLBACK');
      await db.close();
      throw error;
    }
  },

  async renumberInvoicesForYear(db, year) {
    // Get all invoices for this year ordered by creation date
    const invoices = await db.all(
      'SELECT id, invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY created_at ASC',
      [`INV-${year}-%`]
    );
    
    // Renumber each invoice sequentially
    for (let i = 0; i < invoices.length; i++) {
      const newNumber = `INV-${year}-${(i + 1).toString().padStart(4, '0')}`;
      await db.run(
        'UPDATE invoices SET invoice_number = ? WHERE id = ?',
        [newNumber, invoices[i].id]
      );
    }
  },

  async deleteAllInvoices(deletedBy, confirmationCode) {
    // Safety check - require specific confirmation code
    if (confirmationCode !== 'DELETE_ALL_INVOICES_CONFIRM') {
      throw new Error('Invalid confirmation code');
    }
    
    const db = await getDb();
    
    try {
      await db.run('BEGIN TRANSACTION');
      
      // Delete all related records first
      await db.run('DELETE FROM invoice_line_items');
      await db.run('DELETE FROM invoice_payments');
      await db.run('DELETE FROM invoice_tokens');
      await db.run('DELETE FROM invoice_reminders');
      await db.run('DELETE FROM invoice_reminder_settings');
      
      // Finally delete all invoices
      const result = await db.run('DELETE FROM invoices');
      
      await db.run('COMMIT');
      await db.close();
      
      return { success: true, deletedCount: result.changes };
    } catch (error) {
      await db.run('ROLLBACK');
      await db.close();
      throw error;
    }
  },

  async trackInvoiceView(invoiceId, token, clientIp = null, userAgent = null, locationData = {}) {
    console.log('💾 trackInvoiceView called with:', {
      invoiceId,
      token,
      clientIp,
      userAgent: userAgent ? userAgent.substring(0, 50) + '...' : null,
      locationData
    });

    const db = await getDb();
    try {
      // Get previous view stats and invoice update time before inserting new view
      const previousStats = await db.get(`
        SELECT
          COUNT(*) as view_count,
          MAX(viewed_at) as last_viewed
        FROM invoice_views
        WHERE invoice_id = ?
      `, [invoiceId]);

      const invoice = await db.get(`
        SELECT updated_at
        FROM invoices
        WHERE id = ?
      `, [invoiceId]);

      const params = [
        invoiceId,
        token,
        clientIp,
        userAgent,
        locationData.country || null,
        locationData.region || null,
        locationData.city || null,
        locationData.timezone || null
      ];

      console.log('💾 Inserting with params:', params);

      await db.run(`
        INSERT INTO invoice_views (invoice_id, token, client_ip, user_agent, country, region, city, timezone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, params);

      console.log('💾 Invoice view successfully inserted into database');

      // Determine if this is first view or first view after update
      const isFirstView = previousStats.view_count === 0;
      const invoiceUpdatedAfterLastView = previousStats.last_viewed && invoice &&
        new Date(invoice.updated_at) > new Date(previousStats.last_viewed);

      await db.close();

      return {
        isFirstView,
        isFirstViewAfterUpdate: !isFirstView && invoiceUpdatedAfterLastView
      };
    } catch (error) {
      console.error('❌ Error tracking invoice view:', error);
      await db.close();
      return { isFirstView: false, isFirstViewAfterUpdate: false };
    }
  },

  async getInvoiceViewStats(invoiceId) {
    const db = await getDb();
    try {
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total_views,
          MAX(viewed_at) as last_viewed,
          MIN(viewed_at) as first_viewed
        FROM invoice_views 
        WHERE invoice_id = ?
      `, [invoiceId]);
      
      await db.close();
      return stats;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async getAllInvoiceViewStats() {
    const db = await getDb();
    try {
      const stats = await db.all(`
        SELECT 
          i.id,
          i.invoice_number,
          COUNT(iv.id) as total_views,
          MAX(iv.viewed_at) as last_viewed,
          MIN(iv.viewed_at) as first_viewed
        FROM invoices i
        LEFT JOIN invoice_views iv ON i.id = iv.invoice_id
        GROUP BY i.id, i.invoice_number
        ORDER BY i.id DESC
      `);
      
      await db.close();
      return stats;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  async getInvoiceTracking(invoiceId) {
    const db = await getDb();
    try {
      const tracking = await db.all(`
        SELECT
          id,
          invoice_id,
          client_ip,
          user_agent,
          country,
          region,
          city,
          timezone,
          viewed_at
        FROM invoice_views
        WHERE invoice_id = ?
        ORDER BY viewed_at DESC
      `, [invoiceId]);

      await db.close();
      return tracking;
    } catch (error) {
      await db.close();
      throw error;
    }
  },

  // Tax rate management
  async findTaxRate(stateCode, city) {
    const db = await getDb();
    const taxRate = await db.get(`
      SELECT * FROM tax_rates
      WHERE state_code = ? AND
            COALESCE(city, '') = ? AND
            is_active = 1
    `, [stateCode.toUpperCase()|| '', city]);
    await db.close();
    return taxRate;
  },

  async getTaxRateById(id) {
    const db = await getDb();
    const taxRate = await db.get('SELECT * FROM tax_rates WHERE id = ?', [id]);
    await db.close();
    return taxRate;
  },

  async getTaxRateByRate(rate) {
    const db = await getDb();
    // Find the closest matching tax rate (in case of slight floating point differences)
    const taxRate = await db.get(`
      SELECT * FROM tax_rates
      WHERE ABS(tax_rate - ?) < 0.0001
      AND is_active = 1
      ORDER BY ABS(tax_rate - ?)
      LIMIT 1
    `, [rate, rate]);
    await db.close();
    return taxRate;
  },

  async createTaxRate(taxRateData) {
    const db = await getDb();
    const result = await db.run(`
      INSERT INTO tax_rates (state_code, city, tax_rate, updated_by)
      VALUES (?, ?, ?, ?)
    `, [
      taxRateData.state_code,
      taxRateData.city,
      taxRateData.tax_rate,
      taxRateData.updated_by
    ]);
    await db.close();
    return { id: result.lastID };
  },

  async updateTaxRate(id, taxRateData) {
    const db = await getDb();
    const result = await db.run(`
      UPDATE tax_rates 
      SET state_code = ?, city = ?, tax_rate = ?, description = ?, 
          is_active = ?, updated_by = ?, last_updated = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [
      taxRateData.state_code,
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

  async getInvoicePayments(invoiceId) {
    const db = await getDb();
    const payments = await db.all(
      'SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date DESC',
      [invoiceId]
    );
    await db.close();
    return payments;
  },

  async getInvoiceLineItems(invoiceId) {
    const db = await getDb();
    const lineItems = await db.all(
      'SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY line_order',
      [invoiceId]
    );
    await db.close();
    return lineItems;
  },

  async getPaymentById(paymentId) {
    const db = await getDb();
    const payment = await db.get(`
      SELECT p.*, i.total_amount
      FROM invoice_payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE p.id = ?
    `, [paymentId]);

    if (payment) {
      // Calculate remaining balance for this payment
      const allPayments = await db.all(
        'SELECT payment_amount FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date ASC',
        [payment.invoice_id]
      );
      const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);
      payment.remaining_balance = Math.max(0, parseFloat(payment.total_amount) - totalPaid);
    }

    await db.close();
    return payment;
  },

  async getAllPayments() {
    const db = await getDb();
    const payments = await db.all(`
      SELECT p.*, i.invoice_number, c.company_name, c.first_name, c.last_name, c.is_business
      FROM invoice_payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN clients c ON i.client_id = c.id
      ORDER BY p.payment_date DESC
    `);
    await db.close();
    return payments;
  },

  async updatePayment(paymentId, paymentData) {
    const db = await getDb();
    const result = await db.run(`
      UPDATE invoice_payments
      SET payment_amount = ?, payment_method = ?, check_number = ?, payment_date = ?, notes = ?
      WHERE id = ?`,
      [paymentData.payment_amount, paymentData.payment_method, paymentData.check_number,
       paymentData.payment_date, paymentData.notes, paymentId]
    );

    // Update invoice status after payment update
    const payment = await db.get('SELECT invoice_id FROM invoice_payments WHERE id = ?', [paymentId]);
    if (payment) {
      await this.updateInvoiceStatus(payment.invoice_id);
    }

    await db.close();
    return { success: true };
  },

  async deletePayment(paymentId) {
    const db = await getDb();

    // Get invoice_id before deleting
    const payment = await db.get('SELECT invoice_id FROM invoice_payments WHERE id = ?', [paymentId]);

    const result = await db.run('DELETE FROM invoice_payments WHERE id = ?', [paymentId]);

    // Update invoice status after payment deletion
    if (payment) {
      await this.updateInvoiceStatus(payment.invoice_id);
    }

    await db.close();
    return { success: true };
  },

  async updateInvoiceStatus(invoiceId) {
    const db = await getDb();

    const invoice = await db.get('SELECT total_amount, status FROM invoices WHERE id = ?', [invoiceId]);
    const paymentsResult = await db.get(
      'SELECT SUM(payment_amount) as total_paid FROM invoice_payments WHERE invoice_id = ?',
      [invoiceId]
    );

    const totalPaid = paymentsResult.total_paid || 0;
    const balanceDue = Math.max(0, (invoice.total_amount || 0) - totalPaid);
    let status = invoice.status || 'draft';

    if (totalPaid >= invoice.total_amount) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    } else if (invoice.status !== 'draft') {
      // If invoice has been sent (not draft) and no payments, it's unpaid
      status = 'unpaid';
    }

    await db.run('UPDATE invoices SET status = ?, balance_due = ? WHERE id = ?', [status, balanceDue, invoiceId]);
    await db.close();
  },

  async markInvoiceAsSent(invoiceId) {
    const db = await getDb();
    await db.run('UPDATE invoices SET status = ? WHERE id = ?', ['unpaid', invoiceId]);
    await db.close();
  },

  // Database health check and auto-repair
  async performDatabaseHealthCheck() {
    const db = await getDb();
    let fixes = [];
    
    try {
      console.log('🔍 Running database health check...');
      
      // 1. Remove duplicate tax rates
      const duplicateTaxRates = await db.get(`
        SELECT COUNT(*) - COUNT(DISTINCT state_code || '|' || COALESCE(county, '') || '|' || COALESCE(city, '') || '|' || tax_rate) as duplicates
        FROM tax_rates WHERE is_active = 1
      `);
      
      if (duplicateTaxRates.duplicates > 0) {
        // Keep only the first occurrence of each unique combination
        await db.run(`
          DELETE FROM tax_rates 
          WHERE id NOT IN (
            SELECT MIN(id) 
            FROM tax_rates 
            WHERE is_active = 1
            GROUP BY state_code, county, city, tax_rate
          )
        `);
        fixes.push(`Removed ${duplicateTaxRates.duplicates} duplicate tax rates`);
      }
      
      // 2. Check for gaps in invoice IDs and reset if needed
      const invoices = await db.all('SELECT id FROM invoices ORDER BY id');
      if (invoices.length > 0) {
        const firstId = invoices[0].id;
        const lastId = invoices[invoices.length - 1].id;
        const expectedCount = lastId - firstId + 1;
        
        // If there are gaps or IDs don't start from 1, renumber
        if (invoices.length !== expectedCount || firstId !== 1) {
          console.log(`   Renumbering ${invoices.length} invoices to start from 1...`);
          
          // Create a temporary mapping table
          await db.run('CREATE TEMP TABLE id_mapping (old_id INTEGER, new_id INTEGER)');
          
          for (let i = 0; i < invoices.length; i++) {
            const oldId = invoices[i].id;
            const newId = i + 1;
            await db.run('INSERT INTO id_mapping (old_id, new_id) VALUES (?, ?)', [oldId, newId]);
          }
          
          // Update related tables using the mapping
          await db.run(`
            UPDATE invoice_line_items 
            SET invoice_id = (SELECT new_id FROM id_mapping WHERE old_id = invoice_line_items.invoice_id)
          `);
          
          await db.run(`
            UPDATE invoice_payments 
            SET invoice_id = (SELECT new_id FROM id_mapping WHERE old_id = invoice_payments.invoice_id)
          `);
          
          await db.run(`
            UPDATE invoice_tokens 
            SET invoice_id = (SELECT new_id FROM id_mapping WHERE old_id = invoice_tokens.invoice_id)
          `);
          
          await db.run(`
            UPDATE invoice_reminders 
            SET invoice_id = (SELECT new_id FROM id_mapping WHERE old_id = invoice_reminders.invoice_id)
          `);
          
          await db.run(`
            UPDATE invoice_reminder_settings 
            SET invoice_id = (SELECT new_id FROM id_mapping WHERE old_id = invoice_reminder_settings.invoice_id)
          `);
          
          // Update invoices table
          await db.run(`
            UPDATE invoices 
            SET id = (SELECT new_id FROM id_mapping WHERE old_id = invoices.id)
          `);
          
          // Reset auto-increment
          await db.run('UPDATE sqlite_sequence SET seq = ? WHERE name = ?', [invoices.length, 'invoices']);
          
          fixes.push(`Renumbered invoices to start from 1 (was ${firstId}-${lastId})`);
        }
      }
      
      // 3. Reset other auto-increment sequences to proper values
      const tables = ['clients', 'line_item_labels', 'tax_rates', 'designs', 'users'];
      for (const table of tables) {
        const result = await db.get(`SELECT MAX(id) as max_id FROM ${table}`);
        const maxId = result.max_id || 0;
        await db.run('UPDATE sqlite_sequence SET seq = ? WHERE name = ?', [maxId, table]);
      }
      
      if (fixes.length > 0) {
        console.log('✅ Database health check completed with fixes:');
        fixes.forEach(fix => console.log(`   - ${fix}`));
      } else {
        console.log('✅ Database health check passed - no issues found');
      }
      
    } catch (error) {
      console.error('❌ Database health check failed:', error);
    } finally {
      await db.close();
    }
    
    return fixes;
  },

  // Tax rate operations
  async getTaxRates() {
    const db = await getDb();
    const rates = await db.all('SELECT * FROM tax_rates WHERE is_active = 1 ORDER BY state_code, city');
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
  queueDbOperation,
  photoDb,
  employeeDb,
  designDb,
  userDb,
  analyticsDb,
  testimonialDb,
  invoiceDb
};

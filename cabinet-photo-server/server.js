require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { photoDb, employeeDb, designDb, userDb } = require('./database/db-helpers');
const nodemailer = require('nodemailer');
const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://gudinocustom.com', 'https://www.gudinocustom.com','https://api.gudinocustom.com'],
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
const JWT_SECRET = process.env.JWT_SECRET;


app.use(express.json());

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// Middleware for authentication
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  try {
    const user = await userDb.validateSession(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware for role-based access control
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
// IMPORTANT: Serve static files from uploads directory
app.use('/photos', express.static(path.join(__dirname, 'uploads')));

//fully working to sort the photos by category on upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // This function runs AFTER multer has parsed the multipart form
    // So req.body should have the category currently does not
    const category = req.body.category || 'showcase';
    console.log('[MULTER] Upload category from form:', category);

    const uploadPath = path.join(__dirname, 'uploads', category);
    await fs.mkdir(uploadPath, { recursive: true });

    // Store the category in the file object for later use
    file.uploadCategory = category;

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// Get the image dimensions
async function getImageDimensions(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    return { width: null, height: null };
  }
}

// Routes

// Gets all photos - should be authenticated for admin use
app.get('/api/photos', async (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');


  try {
    const photos = await photoDb.getAllPhotos();

    // Sort by display_order first, then by uploaded_at
    const sortedPhotos = photos.sort((a, b) => {
      if (a.category === b.category) {
        return (a.display_order || 999) - (b.display_order || 999);
      }
      return a.category.localeCompare(b.category);
    });

    const formattedPhotos = sortedPhotos.map(photo => {
      const filePath = photo.file_path.replace(/\\/g, '/');
      const thumbnailPath = photo.thumbnail_path ?
        `thumbnails/${photo.thumbnail_path.split('/').pop()}` : null;

      return {
        ...photo,
        full: `/${filePath}`,
        thumbnail: thumbnailPath ? `/photos/${thumbnailPath}` : null,
        url: `/photos/${filePath}`,
        featured: photo.featured === 1
      };
    });


    res.json(formattedPhotos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Upload photo - add authentication and logging
app.post('/api/photos', authenticateUser, requireRole(['admin', 'super_admin']), upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const category = req.file.uploadCategory || req.body.category || 'showcase';

    console.log('[UPLOAD] Final category:', category);
    console.log('[UPLOAD] File saved to:', req.file.path);
    console.log('[UPLOAD] Filename:', req.file.filename);

    const relativePath = `${category}/${req.file.filename}`;

    // Generate thumbnails
    const thumbnailDir = path.join(__dirname, 'uploads', 'thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });

    const thumbnailFilename = `thumb_${req.file.filename}`;
    const thumbnailPath = `thumbnails/${thumbnailFilename}`;
    const thumbnailFullPath = path.join(__dirname, 'uploads', thumbnailPath);

    try {
      await sharp(req.file.path)
        .resize(400, 300, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailFullPath);
      console.log('[THUMBNAIL] Created:', thumbnailFullPath);
    } catch (err) {
      console.error('[THUMBNAIL] Error:', err);
    }

    const dimensions = await getImageDimensions(req.file.path);

    const photoId = await photoDb.createPhoto({
      title: req.body.title || req.file.originalname.split('.')[0],
      filename: req.file.filename,
      original_name: req.file.originalname,
      category: category,
      file_path: relativePath,
      thumbnail_path: thumbnailPath,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      width: dimensions.width,
      height: dimensions.height,
      featured: req.body.featured === 'true'
    });

    console.log('[DATABASE] Saved with ID:', photoId);

   

    const photo = await photoDb.getPhoto(photoId);

    res.json({
      success: true,
      photo: {
        ...photo,
        full: `/${relativePath}`,
        thumbnail: `photos/thumbnails/${thumbnailPath}`,
        url: `/photos/${relativePath}`,
        featured: photo.featured === 1
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo: ' + error.message });
  }
});
app.put('/api/photos/reorder', async (req, res) => {
  try {
    const { photoIds } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'Invalid photo IDs array' });
    }

    console.log('[REORDER] Updating order for photos:', photoIds);

    await photoDb.updateDisplayOrder(photoIds);



    res.json({ success: true, message: 'Photo order updated successfully' });
  } catch (error) {
    console.error('[REORDER] Error:', error);
    res.status(500).json({ error: 'Failed to update photo order: ' + error.message });
  }
});

// Updates the photo
app.put('/api/photos/:id', async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);
    const updates = {};

    // Only update allowed fields
    const allowedFields = ['title', 'category', 'featured', 'display_order'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
        // Convert boolean featured to integer
        if (field === 'featured') {
          updates[field] = req.body[field] ? 1 : 0;
        }
      }
    });

    // Handle category change file moving logic (existing code)
    if (updates.category) {
      const photo = await photoDb.getPhoto(photoId);
      if (photo && photo.category !== updates.category) {
        const oldPath = path.join(__dirname, 'uploads', photo.category, photo.filename);
        const newPath = path.join(__dirname, 'uploads', updates.category, photo.filename);

        await fs.mkdir(path.join(__dirname, 'uploads', updates.category), { recursive: true });

        try {
          await fs.rename(oldPath, newPath);
          console.log(`[MOVE] Moved file from ${oldPath} to ${newPath}`);
          updates.file_path = `${updates.category}/${photo.filename}`;
          console.log('[MOVE] Updated file_path to:', updates.file_path);
        } catch (error) {
          console.error('[MOVE] Error moving file:', error);
        }
      }
    }

    const success = await photoDb.updatePhoto(photoId, updates);

    if (success) {

      const photo = await photoDb.getPhoto(photoId);
      const filePath = photo.file_path.replace(/\\/g, '/');
      const thumbnailPath = photo.thumbnail_path ? photo.thumbnail_path.replace(/\\/g, '/') : null;

      res.json({
        success: true,
        photo: {
          ...photo,
          full: `/photos/${filePath}`,
          thumbnail: thumbnailPath ? `/photos/${thumbnailPath}` : null,
          url: `/photos/${filePath}`,
          featured: photo.featured === 1
        }
      });
    } else {
      res.status(404).json({ error: 'Photo not found' });
    }

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Delete photo - add authentication and logging
app.delete('/api/photos/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);

    const photo = await photoDb.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    console.log('[DELETE] Photo info:', photo);

    // Delete files from filesystem (existing logic)
    try {
      const mainFilePath = path.join(__dirname, 'uploads', photo.file_path.replace(/\\/g, '/'));
      console.log('[DELETE] Attempting to delete:', mainFilePath);

      try {
        await fs.unlink(mainFilePath);
        console.log('[DELETE] Successfully deleted main file');
      } catch (err) {
        const altPath = path.join(__dirname, 'uploads', photo.category, photo.filename);
        console.log('[DELETE] First attempt failed, trying:', altPath);
        await fs.unlink(altPath);
        console.log('[DELETE] Successfully deleted main file (alt path)');
      }

      if (photo.thumbnail_path) {
        const thumbnailFilePath = path.join(__dirname, 'uploads', photo.thumbnail_path.replace(/\\/g, '/'));
        try {
          await fs.unlink(thumbnailFilePath);
          console.log('[DELETE] Successfully deleted thumbnail');
        } catch (err) {
          console.warn('[DELETE] Could not delete thumbnail:', err.message);
        }
      }
    } catch (fileError) {
      console.warn('[DELETE] Error deleting files:', fileError.message);
    }

    const success = await photoDb.deletePhoto(photoId);

    if (success) {
      

      res.json({ success: true, message: 'Photo deleted successfully' });
    } else {
      res.status(404).json({ error: 'Photo not found in database' });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});


// Get a single photo
app.get('/api/photos/:id', async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);
    const photo = await photoDb.getPhoto(photoId);

    if (photo) {

      const filePath = photo.file_path.replace(/\\/g, '/');
      const thumbnailPath = photo.thumbnail_path ? photo.thumbnail_path.replace(/\\/g, '/') : null;

      res.json({
        ...photo,
        full: `/photos/${filePath}`,
        thumbnail: thumbnailPath ? `/photos/${thumbnailPath}` : null,
        url: `/photos/${filePath}`,
        featured: photo.featured === 1
      });
    } else {
      res.status(404).json({ error: 'Photo not found' });
    }
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Gets the storage info
app.get('/api/storage-info', async (req, res) => {
  try {
    const db = await getDb();

    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_photos,
        SUM(file_size) as total_size,
        COUNT(CASE WHEN featured = 1 THEN 1 END) as featured_count
      FROM photos
    `);

    const categoryStats = await db.all(`
      SELECT category, COUNT(*) as count
      FROM photos
      GROUP BY category
    `);

    await db.close();

    const categoryBreakdown = {};
    categoryStats.forEach(stat => {
      categoryBreakdown[stat.category] = stat.count;
    });


    res.json({
      totalPhotos: stats.total_photos || 0,
      totalStorageUsed: stats.total_size ? `${(stats.total_size / 1024 / 1024).toFixed(2)} MB` : '0 MB',
      featuredCount: stats.featured_count || 0,
      byCategory: categoryBreakdown,
      storagePath: path.resolve('uploads'),
      serverUrl: `https://api.gudinocustom.com:${PORT}`
    });

  } catch (error) {
    console.error('Storage info error:', error);
    res.status(500).json({ error: 'Failed to get storage info' });
  }
});

// Add authentication to debug uploads
app.get('/api/debug/uploads', authenticateUser, requireRole(['super_admin']), async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    const categories = await fs.readdir(uploadsDir);

    const structure = {};
    for (const category of categories) {
      const categoryPath = path.join(uploadsDir, category);
      const stat = await fs.stat(categoryPath);
      if (stat.isDirectory()) {
        const files = await fs.readdir(categoryPath);
        structure[category] = files;
      }
    }


    res.json({ uploadsDir, structure });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});
// Login route
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await userDb.authenticateUser(username, password);

    if (!result) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

  
    res.json({
      token: result.token,
      user: result.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', authenticateUser, async (req, res) => {
  try {
    // In a real implementation, you'd invalidate the session token
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});



// User management endpoints (super admin only)
app.get('/api/users', authenticateUser, requireRole('super_admin'), async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const users = await userDb.getAllUsers();
    
    // Filter out inactive users unless specifically requested
    const filteredUsers = includeInactive ? users : users.filter(user => user.is_active === 1);
    
    res.json(filteredUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticateUser, requireRole('super_admin'), async (req, res) => {
  const { username, email, password, role, full_name } = req.body;

  try {
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const userId = await userDb.createUser({
      username,
      email,
      password,
      role,
      full_name,
      created_by: req.user.id
    });

    

    res.status(201).json({
      message: 'User created successfully',
      userId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

app.put('/api/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const updates = req.body;

  try {
    // Prevent super admin from demoting themselves
    if (userId === req.user.id && updates.role !== 'super_admin') {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const success = await userDb.updateUser(userId, updates);

    if (!success) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }


    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticateUser, requireRole('super_admin'), async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    // Prevent super admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Hard delete the user
    const db = await getDb();
    const result = await db.run('DELETE FROM users WHERE id = ?', userId);
    await db.close();

    if (result.changes > 0) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const employees = await employeeDb.getAllEmployees(includeInactive);

    // Add full photo URL to each employee
    const employeesWithPhotos = employees.map(emp => ({
      ...emp,
      photo_url: emp.photo_path ? `/photos/employees/${emp.photo_filename}` : null,
      is_active: emp.is_active === 1
    }));

    res.json(employeesWithPhotos);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get single employee
app.get('/api/employees/:id', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employee = await employeeDb.getEmployee(employeeId);

    if (employee) {
      employee.photo_url = employee.photo_path ? `/photos/employees/${employee.photo_filename}` : null;
      employee.is_active = employee.is_active === 1;
      res.json(employee);
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Create new employee with photo upload
app.post('/api/employees', upload.single('photo'), async (req, res) => {
  try {
    let photoPath = null;
    let photoFilename = null;

    // Handle photo upload if provided
    if (req.file) {
      // Create employees directory
      const employeesDir = path.join(__dirname, 'uploads', 'employees');
      await fs.mkdir(employeesDir, { recursive: true });

      // Generate unique filename
      const uniqueName = `emp_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
      const filePath = path.join(employeesDir, uniqueName);

      // Move/save the file
      if (req.file.buffer) {
        // If using memory storage
        await fs.writeFile(filePath, req.file.buffer);
      } else {
        // If using disk storage, move the file
        await fs.rename(req.file.path, filePath);
      }

      // Create thumbnail
      const thumbnailDir = path.join(__dirname, 'uploads', 'employees', 'thumbnails');
      await fs.mkdir(thumbnailDir, { recursive: true });

      const thumbnailPath = path.join(thumbnailDir, `thumb_${uniqueName}`);

      try {
        await sharp(filePath)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
      } catch (err) {
        console.error('[THUMBNAIL] Error creating employee thumbnail:', err);
      }

      photoPath = `employees/${uniqueName}`;
      photoFilename = uniqueName;
    }

    // Save employee to database
    const employeeData = {
      name: req.body.name,
      position: req.body.position,
      bio: req.body.bio || '',
      email: req.body.email || '',
      phone: req.body.phone || '',
      photo_path: photoPath,
      photo_filename: photoFilename,
      joined_date: req.body.joined_date || null,
      display_order: req.body.display_order || 999
    };

    const employeeId = await employeeDb.insertEmployee(employeeData);
    const newEmployee = await employeeDb.getEmployee(employeeId);

    res.json({
      success: true,
      employee: {
        ...newEmployee,
        photo_url: photoPath ? `/photos/${photoPath}` : null,
        is_active: newEmployee.is_active === 1
      }
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee: ' + error.message });
  }
});
app.put('/api/employees/reorder', async (req, res) => {
  try {
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ error: 'Invalid employee IDs array' });
    }

    await employeeDb.updateEmployeeOrder(employeeIds);

    res.json({ success: true, message: 'Employee order updated successfully' });
  } catch (error) {
    console.error('[REORDER] Error:', error);
    res.status(500).json({ error: 'Failed to update employee order' });
  }
});
// Update employee
app.put('/api/employees/:id', upload.single('photo'), async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const updates = {};

    // Handle text fields
    const allowedFields = ['name', 'position', 'bio', 'email', 'phone', 'joined_date', 'display_order', 'is_active'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
        // Convert boolean is_active to integer
        if (field === 'is_active') {
          updates[field] = req.body[field] === 'true' || req.body[field] === true ? 1 : 0;
        }
      }
    });

    // Handle photo upload if provided
    if (req.file) {
      // Get current employee to delete old photo
      const currentEmployee = await employeeDb.getEmployee(employeeId);

      // Delete old photo if exists
      if (currentEmployee && currentEmployee.photo_path) {
        const oldPhotoPath = path.join(__dirname, 'uploads', currentEmployee.photo_path);
        try {
          await fs.unlink(oldPhotoPath);
          // Also delete old thumbnail
          const oldThumbPath = path.join(__dirname, 'uploads', 'employees', 'thumbnails', `thumb_${currentEmployee.photo_filename}`);
          await fs.unlink(oldThumbPath).catch(() => { });
        } catch (err) {
          console.log('Could not delete old photo:', err.message);
        }
      }

      // Save new photo
      const employeesDir = path.join(__dirname, 'uploads', 'employees');
      await fs.mkdir(employeesDir, { recursive: true });

      const uniqueName = `emp_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
      const filePath = path.join(employeesDir, uniqueName);

      if (req.file.buffer) {
        await fs.writeFile(filePath, req.file.buffer);
      } else {
        await fs.rename(req.file.path, filePath);
      }

      // Create thumbnail
      const thumbnailDir = path.join(__dirname, 'uploads', 'employees', 'thumbnails');
      await fs.mkdir(thumbnailDir, { recursive: true });

      const thumbnailPath = path.join(thumbnailDir, `thumb_${uniqueName}`);

      try {
        await sharp(filePath)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
      } catch (err) {
        console.error('[THUMBNAIL] Error:', err);
      }

      updates.photo_path = `employees/${uniqueName}`;
      updates.photo_filename = uniqueName;
    }

    const success = await employeeDb.updateEmployee(employeeId, updates);

    if (success) {
      const employee = await employeeDb.getEmployee(employeeId);
      res.json({
        success: true,
        employee: {
          ...employee,
          photo_url: employee.photo_path ? `/photos/${employee.photo_path}` : null,
          is_active: employee.is_active === 1
        }
      });
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }

  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const hardDelete = req.query.hard === 'true';

    if (hardDelete) {
      // Get employee to delete photo
      const employee = await employeeDb.getEmployee(employeeId);
      if (employee && employee.photo_path) {
        const photoPath = path.join(__dirname, 'uploads', employee.photo_path);
        try {
          await fs.unlink(photoPath);
          // Delete thumbnail too
          const thumbPath = path.join(__dirname, 'uploads', 'employees', 'thumbnails', `thumb_${employee.photo_filename}`);
          await fs.unlink(thumbPath).catch(() => { });
        } catch (err) {
          console.log('Could not delete photo:', err.message);
        }
      }
    }

    const success = await employeeDb.deleteEmployee(employeeId, hardDelete);

    if (success) {
      res.json({ success: true, message: 'Employee deleted successfully' });
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }

  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Reorder employees

// Get the database connection helper
async function getDb() {
  const sqlite3 = require('sqlite3').verbose();
  const { open } = require('sqlite');

  return open({
    filename: path.join(__dirname, 'database', 'cabinet_photos.db'),
    driver: sqlite3.Database
  });
}

// Get all the pricing data
app.get('/api/prices', async (req, res) => {
  try {
    const db = await getDb();

    // Get cabinet prices
    const cabinetPrices = await db.all('SELECT * FROM cabinet_prices');
    const basePrices = {};
    cabinetPrices.forEach(item => {
      basePrices[item.cabinet_type] = parseFloat(item.base_price);
    });

    // Get material multipliers
    const materials = await db.all('SELECT * FROM material_pricing');
    const materialMultipliers = {};
    materials.forEach(item => {
      materialMultipliers[item.material_type] = parseFloat(item.multiplier);
    });

    // Get color pricing
    const colors = await db.all('SELECT * FROM color_pricing');
    const colorPricing = {};
    colors.forEach(item => {
      const key = isNaN(item.color_count) ? item.color_count : parseInt(item.color_count);
      colorPricing[key] = parseFloat(item.price_addition);
    });

    await db.close();

    console.log('Loaded prices with materials:', {
      basePrices,
      materialMultipliers,
      colorPricing
    });

    res.json({
      basePrices,
      materialMultipliers,
      colorPricing
    });

  } catch (error) {
    console.error('Error loading prices:', error);
    res.status(500).json({ error: 'Failed to load prices' });
  }
});
// Update the cabinet prices
app.put('/api/prices/cabinets', async (req, res) => {
  try {
    const db = await getDb();
    const prices = req.body;

    console.log('Updating cabinet prices:', prices);

    // Update each cabinet price
    for (const [cabinetType, price] of Object.entries(prices)) {
      await db.run(
        `UPDATE cabinet_prices 
         SET base_price = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE cabinet_type = ?`,
        [price, cabinetType]
      );
    }

    await db.close();

    res.json({ success: true, message: 'Cabinet prices updated successfully' });

  } catch (error) {
    console.error('Error updating cabinet prices:', error);
    res.status(500).json({ error: 'Failed to update cabinet prices' });
  }

});
app.get('/api/prices/materials', async (req, res) => {
  try {
    const db = await getDb();
    const materials = await db.all('SELECT * FROM material_pricing ORDER BY material_type');

    // Convert to object format for frontend
    const materialObject = {};
    materials.forEach(m => {
      materialObject[m.material_type] = parseFloat(m.multiplier);
    });

    await db.close();
    console.log('Loaded materials:', materialObject);
    res.json(materialObject);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});
// Update the material multipliers
app.put('/api/prices/materials', async (req, res) => {
  try {
    const materials = req.body;
    console.log('Saving materials:', materials);

    const db = await getDb();

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Delete all existing materials
      await db.run('DELETE FROM material_pricing');

      // Insert all materials (including new ones)
      const stmt = await db.prepare(
        'INSERT INTO material_pricing (material_type, multiplier) VALUES (?, ?)'
      );

      for (const [material, multiplier] of Object.entries(materials)) {
        await stmt.run(material, multiplier);
        console.log(`Inserted material: ${material} with multiplier: ${multiplier}`);
      }

      await stmt.finalize();
      await db.run('COMMIT');

      console.log('Materials saved successfully');
      res.json({ success: true, message: 'Materials saved successfully' });

    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    } finally {
      await db.close();
    }

  } catch (error) {
    console.error('Error saving materials:', error);
    res.status(500).json({ error: 'Failed to save materials: ' + error.message });
  }
});

// Update the color pricing
app.put('/api/prices/colors', async (req, res) => {
  try {
    const db = await getDb();
    const colors = req.body;

    console.log('Updating color pricing:', colors);

    // Update each color price
    for (const [colorCount, price] of Object.entries(colors)) {
      await db.run(
        `UPDATE color_pricing 
         SET price_addition = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE color_count = ?`,
        [price, colorCount]
      );
    }

    await db.close();

    res.json({ success: true, message: 'Color pricing updated successfully' });

  } catch (error) {
    console.error('Error updating color pricing:', error);
    res.status(500).json({ error: 'Failed to update color pricing' });
  }
});

// Get price history if you want to see it but not really needed
app.get('/api/prices/history', async (req, res) => {
  try {
    const db = await getDb();

    const history = await db.all(`
      SELECT 'cabinet' as type, cabinet_type as item, base_price as value, updated_at 
      FROM cabinet_prices 
      UNION ALL
      SELECT 'material' as type, material_type as item, multiplier as value, updated_at 
      FROM material_pricing
      UNION ALL
      SELECT 'color' as type, color_count as item, price_addition as value, updated_at 
      FROM color_pricing
      ORDER BY updated_at DESC
      LIMIT 50
    `);

    await db.close();

    res.json(history);

  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});
// Get all designs (for admin panel)
app.get('/api/designs', async (req, res) => {
  try {
    const status = req.query.status || null;
    const designs = await designDb.getAllDesigns(status);

    res.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// Send email notification
app.post('/api/designs', uploadMemory.single('pdf'), async (req, res) => {
  try {
    console.log('\n=== NEW DESIGN SUBMISSION ===');

    // Parse design data from form data
    let designData;
    try {
      designData = JSON.parse(req.body.designData);
      console.log('Parsed design data successfully');
    } catch (parseError) {
      console.error('Failed to parse design data:', parseError);
      return res.status(400).json({ error: 'Invalid design data format' });
    }

    // Add PDF buffer
    if (req.file) {
      designData.pdf_data = req.file.buffer;
      console.log('PDF size:', req.file.buffer.length, 'bytes');
    }

    console.log('Design images:', {
      has_floor_plan: !!designData.floor_plan_image,
      floor_plan_size: designData.floor_plan_image ? designData.floor_plan_image.length : 0,
      wall_view_count: designData.wall_view_images?.length || 0,
      total_size: JSON.stringify(designData).length
    });

    // Check if data is too large (SQLite has limits)
    const dataSize = JSON.stringify(designData).length;
    if (dataSize > 10 * 1024 * 1024) { // 10MB limit
      console.warn('Design data very large:', (dataSize / 1024 / 1024).toFixed(2), 'MB');
    }
    // Save to database
    const designId = await designDb.saveDesign(designData);
    console.log(` Design #${designId} saved for ${designData.client_name}`);

    // Try to send email notification
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const info = await emailTransporter.sendMail({
          from: `"Cabinet Designer" <${process.env.EMAIL_USER}>`,
          to: 'admin@gudinocustom.com',
          subject: `New Cabinet Design - ${designData.client_name} - $${designData.total_price.toFixed(2)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Cabinet Design Submitted</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Client:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${designData.client_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Contact:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${designData.contact_preference === 'email' ? designData.client_email : designData.client_phone}
                    (prefers ${designData.contact_preference})
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Total:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #27ae60; font-size: 18px;">
                    <strong>$${designData.total_price.toFixed(2)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Rooms:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${designData.include_kitchen ? `✓ Kitchen (${designData.kitchen_data?.elements?.length || 0} items)<br>` : ''}
                    ${designData.include_bathroom ? `✓ Bathroom (${designData.bathroom_data?.elements?.length || 0} items)` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Design Preview:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${designData.floor_plan_image ? '✓ Floor plan included<br>' : ''}
                    ${designData.wall_view_images?.length ? `✓ ${designData.wall_view_images.length} wall views included` : ''}
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin#designs" 
                   style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Design in Admin Panel
                </a>
              </div>
            </div>
          `
        });

        console.log('📧 Email sent:', info.messageId);
      } catch (emailError) {
        console.error('⚠️  Email failed:', emailError.message);
      }
    }

    res.json({
      success: true,
      designId,
      message: 'Design saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving design:', error);
    res.status(500).json({
      error: 'Failed to save design',
      details: error.message
    });
  }
});

app.get('/api/designs/stats', async (req, res) => {
  try {
    const stats = await designDb.getDesignStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching design stats:', error);
    res.status(500).json({ error: 'Failed to fetch design statistics' });
  }
});

// Also fix the single design route
app.get('/api/designs/:id', async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const design = await designDb.getDesign(designId);

    if (design) {

      res.json(design);
    } else {
      res.status(404).json({ error: 'Design not found' });
    }
  } catch (error) {
    console.error('Error fetching design:', error);
    res.status(500).json({ error: 'Failed to fetch design' });
  }
});
app.delete('/api/designs/:id', async (req, res) => {
  try {
    const designId = parseInt(req.params.id);

    const db = await getDb();
    const result = await db.run('DELETE FROM designs WHERE id = ?', designId);
    await db.close();

    if (result.changes > 0) {
      console.log(`Design #${designId} deleted`);


      res.json({ success: true, message: 'Design deleted successfully' });
    } else {
      res.status(404).json({ error: 'Design not found' });
    }
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
});

// Get design PDF
app.get('/api/designs/:id/pdf', async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const pdfData = await designDb.getDesignPdf(designId);

    if (pdfData) {

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="design-${designId}.pdf"`
      });
      res.send(pdfData);
    } else {
      res.status(404).json({ error: 'PDF not found' });
    }
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});

// Update design status
app.put('/api/designs/:id/status', async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const { status, viewedBy } = req.body;

    const success = await designDb.updateDesignStatus(designId, status, viewedBy || req.user.username);

    if (success) {
     
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Design not found' });
    }
  } catch (error) {
    console.error('Error updating design status:', error);
    res.status(500).json({ error: 'Failed to update design status' });
  }
});
app.get('/api/designs/:id/debug', async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const db = await getDb();

    // Get raw data from database
    const design = await db.get('SELECT * FROM designs WHERE id = ?', designId);

    if (design) {
      // Check if kitchen_data and bathroom_data are stored
      const debugInfo = {
        id: design.id,
        client_name: design.client_name,
        has_kitchen_data: !!design.kitchen_data,
        has_bathroom_data: !!design.bathroom_data,
        kitchen_data_length: design.kitchen_data ? design.kitchen_data.length : 0,
        bathroom_data_length: design.bathroom_data ? design.bathroom_data.length : 0,
        kitchen_data_preview: design.kitchen_data ? design.kitchen_data.substring(0, 200) : null,
        bathroom_data_preview: design.bathroom_data ? design.bathroom_data.substring(0, 200) : null,
        pdf_data_size: design.pdf_data ? design.pdf_data.length : 0
      };

      res.json(debugInfo);
    } else {
      res.status(404).json({ error: 'Design not found' });
    }

    await db.close();
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uploadsDir: path.join(__dirname, 'uploads'),
    databasePath: path.join(__dirname, 'database', 'cabinet_photos.db')
  });
});

// List uploads directory (for debugging)
app.get('/api/debug/uploads', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    const categories = await fs.readdir(uploadsDir);

    const structure = {};
    for (const category of categories) {
      const categoryPath = path.join(uploadsDir, category);
      const stat = await fs.stat(categoryPath);
      if (stat.isDirectory()) {
        const files = await fs.readdir(categoryPath);
        structure[category] = files;
      }
    }


    res.json({ uploadsDir, structure });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use((req, res) => {

  res.status(404).json({ error: 'Endpoint not found' });
});
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/photos`);
  console.log(`Static files: http://localhost:${PORT}/photos/`);
  console.log(`Debug uploads: http://localhost:${PORT}/api/debug/uploads`);
  console.log(`=================================\n`);
});

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Database connection
async function getDb() {
  return open({
    filename: path.join(__dirname,'cabinet_photos.db'),
    driver: sqlite3.Database
  });
}

// Photo operations
const photoDb = {
  // Get all photos
  async getAllPhotos(category = null) {
    const db = await getDb();
    let query = 'SELECT * FROM photos';
    const params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY display_order ASC, uploaded_at DESC';
    
    const photos = await db.all(query, params);
    await db.close();
    return photos;
  },

  // Get single photo
  async getPhoto(id) {
    const db = await getDb();
    const photo = await db.get('SELECT * FROM photos WHERE id = ?', id);
    await db.close();
    return photo;
  },

  // Insert new photo
  async insertPhoto(photoData) {
    const db = await getDb();
    const {
      title,
      filename,
      original_name,
      category,
      file_path,
      thumbnail_path,
      file_size,
      mime_type,
      width,
      height,
      featured = false
    } = photoData;

    const result = await db.run(
      `INSERT INTO photos (
        title, filename, original_name, category, file_path, 
        thumbnail_path, file_size, mime_type, width, height, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, filename, original_name, category, file_path, 
       thumbnail_path, file_size, mime_type, width, height, featured ? 1 : 0]
    );

    await db.close();
    return result.lastID;
  },

  // Update photo
  async updatePhoto(id, updates) {
  const db = await getDb();
  const fields = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (fields.length === 0) {
    // If no updates, just update the timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
  } else {
    // Always update updated_at when other fields change
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
  }

  values.push(id);

  const query = `
    UPDATE photos 
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  const result = await db.run(query, values);
  await db.close();
  return result.changes > 0;
},

  // Delete photo
  async deletePhoto(id) {
    const db = await getDb();
    const result = await db.run('DELETE FROM photos WHERE id = ?', id);
    await db.close();
    return result.changes > 0;
  },

  // Get photos by category with count
  async getPhotosByCategory() {
    const db = await getDb();
    const result = await db.all(`
      SELECT 
        c.name,
        c.slug,
        c.icon,
        COUNT(p.id) as photo_count
      FROM categories c
      LEFT JOIN photos p ON c.slug = p.category
      GROUP BY c.id
      ORDER BY c.display_order
    `);
    await db.close();
    return result;
  },

  // Update display order
  async updateDisplayOrder(photoIds) {
  const db = await getDb();
  
  for (let i = 0; i < photoIds.length; i++) {
    console.log(`[DB] Reorder: id = ${photoIds[i]}, order = ${i + 1}`);
    await db.run(
      'UPDATE photos SET display_order = ? WHERE id = ?',
      [i + 1, photoIds[i]]
    );
  }
  
  await db.close();
}
,

  // Search photos
  async searchPhotos(searchTerm) {
    const db = await getDb();
    const photos = await db.all(
      `SELECT * FROM photos 
       WHERE title LIKE ? OR category LIKE ?
       ORDER BY uploaded_at DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
    await db.close();
    return photos;
  }
};
// Employee operations
const employeeDb = {
  // Get all employees
  async getAllEmployees(includeInactive = false) {
    const db = await getDb();
    let query = 'SELECT * FROM employees';
    
    if (!includeInactive) {
      query += ' WHERE is_active = 1';
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC';
    
    const employees = await db.all(query);
    await db.close();
    return employees;
  },

  // Get single employee
  async getEmployee(id) {
    const db = await getDb();
    const employee = await db.get('SELECT * FROM employees WHERE id = ?', id);
    await db.close();
    return employee;
  },

  // Insert new employee
  async insertEmployee(employeeData) {
    const db = await getDb();
    const {
      name,
      position,
      bio,
      email,
      phone,
      photo_path,
      photo_filename,
      joined_date,
      display_order = 0
    } = employeeData;

    const result = await db.run(
      `INSERT INTO employees (
        name, position, bio, email, phone, photo_path, 
        photo_filename, joined_date, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, position, bio, email, phone, photo_path, 
       photo_filename, joined_date, display_order]
    );

    await db.close();
    return result.lastID;
  },

  // Update employee
  async updateEmployee(id, updates) {
    const db = await getDb();
    const fields = [];
    const values = [];

    // Build dynamic update query
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    values.push(id);
    
    const query = `
      UPDATE employees 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    const result = await db.run(query, values);
    await db.close();
    return result.changes > 0;
  },

  // Delete employee (soft delete by setting is_active = 0)
  async deleteEmployee(id, hardDelete = false) {
    const db = await getDb();
    let result;
    
    if (hardDelete) {
      // First get the employee to delete their photo
      const employee = await db.get('SELECT photo_path FROM employees WHERE id = ?', id);
      result = await db.run('DELETE FROM employees WHERE id = ?', id);
    } else {
      // Soft delete
      result = await db.run('UPDATE employees SET is_active = 0 WHERE id = ?', id);
    }
    
    await db.close();
    return result.changes > 0;
  },

  // Update display order
  async updateEmployeeOrder(employeeIds) {
    const db = await getDb();
    
    for (let i = 0; i < employeeIds.length; i++) {
      await db.run(
        'UPDATE employees SET display_order = ? WHERE id = ?',
        [i + 1, employeeIds[i]]
      );
    }
    
    await db.close();
  },

  // Search employees
  async searchEmployees(searchTerm) {
    const db = await getDb();
    const employees = await db.all(
      `SELECT * FROM employees 
       WHERE (name LIKE ? OR position LIKE ? OR bio LIKE ?) 
       AND is_active = 1
       ORDER BY display_order ASC`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    await db.close();
    return employees;
  }
};
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

      console.log('Saving design with images:', {
        has_floor_plan: !!floor_plan_image,
        wall_view_count: wall_view_images?.length || 0
      });

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

      console.log('Design saved with ID:', result.lastID);
      await db.close();
      return result.lastID;
    } catch (error) {
      await db.close();
      console.error('Database save error:', error);
      throw error;
    }
  },

  async getDesign(id) {
    const db = await getDb();
    
    try {
      const design = await db.get('SELECT * FROM designs WHERE id = ?', id);
      
      if (design) {
        // Parse JSON data
        try {
          if (design.kitchen_data) {
            design.kitchen_data = JSON.parse(design.kitchen_data);
          }
        } catch (e) {
          console.error('Failed to parse kitchen_data:', e);
          design.kitchen_data = null;
        }
        
        try {
          if (design.bathroom_data) {
            design.bathroom_data = JSON.parse(design.bathroom_data);
          }
        } catch (e) {
          console.error('Failed to parse bathroom_data:', e);
          design.bathroom_data = null;
        }

        try {
          if (design.wall_view_images) {
            design.wall_view_images = JSON.parse(design.wall_view_images);
          }
        } catch (e) {
          console.error('Failed to parse wall_view_images:', e);
          design.wall_view_images = null;
        }
        
        // Update viewed status
        await db.run(
          'UPDATE designs SET status = ?, viewed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
          ['viewed', id, 'new']
        );
      }
      
      await db.close();
      return design;
    } catch (error) {
      await db.close();
      console.error('Error retrieving design:', error);
      throw error;
    }
  },

  async getDesignPdf(id) {
    const db = await getDb();
    const result = await db.get('SELECT pdf_data FROM designs WHERE id = ?', id);
    await db.close();
    return result ? result.pdf_data : null;
  },

  async updateDesignStatus(id, status, viewedBy = null) {
    const db = await getDb();
    const result = await db.run(
      'UPDATE designs SET status = ?, viewed_at = CURRENT_TIMESTAMP, viewed_by = ? WHERE id = ?',
      [status, viewedBy, id]
    );
    await db.close();
    return result.changes > 0;
  },

  async getDesignStats() {
    const db = await getDb();
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'viewed' THEN 1 ELSE 0 END) as viewed_count
      FROM designs
    `);
    await db.close();
    return stats;
  },

  // Get all designs
  async getAllDesigns(status = null) {
    const db = await getDb();
    
    try {
      let query = 'SELECT * FROM designs';
      const params = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const designs = await db.all(query, params);
      
      // Parse JSON data for each design
      const processedDesigns = designs.map(design => {
        try {
          if (design.kitchen_data) {
            design.kitchen_data = JSON.parse(design.kitchen_data);
          }
        } catch (e) {
          console.error('Failed to parse kitchen_data for design', design.id, ':', e);
          design.kitchen_data = null;
        }
        
        try {
          if (design.bathroom_data) {
            design.bathroom_data = JSON.parse(design.bathroom_data);
          }
        } catch (e) {
          console.error('Failed to parse bathroom_data for design', design.id, ':', e);
          design.bathroom_data = null;
        }

        try {
          if (design.wall_view_images) {
            design.wall_view_images = JSON.parse(design.wall_view_images);
          }
        } catch (e) {
          console.error('Failed to parse wall_view_images for design', design.id, ':', e);
          design.wall_view_images = null;
        }
        
        return design;
      });
      
      await db.close();
      return processedDesigns;
      
    } catch (error) {
      await db.close();
      console.error('Error retrieving designs:', error);
      throw error;
    }
  },
};
// Export both photoDb and employeeDb
module.exports = { photoDb, employeeDb , designDb};
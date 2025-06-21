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

    // Build dynamic update query
    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    values.push(id);
    
    const query = `
      UPDATE photos 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
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
      await db.run(
        'UPDATE photos SET display_order = ? WHERE id = ?',
        [i + 1, photoIds[i]]
      );
    }
    
    await db.close();
  },

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

module.exports = { photoDb };
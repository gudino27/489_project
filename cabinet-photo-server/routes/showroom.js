// Virtual Showroom Routes
// Handles 360° showroom rooms, hotspots, and settings
const express = require('express');
const router = express.Router();
const { showroomDb } = require('../db-helpers');
const { authenticateUser, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Configure multer for 360° image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'showroom');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `showroom-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for 360° images
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
  }
});

// ==================== PUBLIC ROUTES ====================

// Get full showroom data for public display (enabled rooms only)
router.get('/public', async (req, res) => {
  try {
    const showroomData = await showroomDb.getFullShowroomData(true);
    res.json(showroomData);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching public showroom data:', error);
    res.status(500).json({ error: 'Failed to fetch showroom data' });
  }
});

// Get all enabled rooms for public display
router.get('/public/rooms', async (req, res) => {
  try {
    const rooms = await showroomDb.getAllRooms(true);
    res.json(rooms);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching public rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get starting room for initial showroom view
router.get('/public/starting-room', async (req, res) => {
  try {
    const room = await showroomDb.getStartingRoom();
    if (!room) {
      return res.status(404).json({ error: 'No showroom rooms available' });
    }
    // Get hotspots for the room
    const hotspots = await showroomDb.getHotspotsByRoomId(room.id, true);
    room.hotspots = hotspots;
    res.json(room);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching starting room:', error);
    res.status(500).json({ error: 'Failed to fetch starting room' });
  }
});

// Get a specific room with hotspots (public)
router.get('/public/rooms/:id', async (req, res) => {
  try {
    const room = await showroomDb.getRoomById(parseInt(req.params.id));
    if (!room || !room.is_enabled) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const hotspots = await showroomDb.getHotspotsByRoomId(room.id, true);
    room.hotspots = hotspots;
    res.json(room);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get showroom settings (public)
router.get('/public/settings', async (req, res) => {
  try {
    const settings = await showroomDb.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ==================== ADMIN ROUTES - ROOMS ====================

// Get all rooms (admin - includes disabled)
router.get('/admin/rooms', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const rooms = await showroomDb.getAllRooms(false);
    res.json(rooms);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get full showroom data (admin - includes disabled)
router.get('/admin/full', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const showroomData = await showroomDb.getFullShowroomData(false);
    res.json(showroomData);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching full showroom data:', error);
    res.status(500).json({ error: 'Failed to fetch showroom data' });
  }
});

// Get a specific room with hotspots (admin)
router.get('/admin/rooms/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const room = await showroomDb.getRoomById(parseInt(req.params.id));
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const hotspots = await showroomDb.getHotspotsByRoomId(room.id, false);
    room.hotspots = hotspots;
    res.json(room);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Create a new room
router.post('/admin/rooms', authenticateUser, requireRole(['admin', 'super_admin']), upload.single('image360'), async (req, res) => {
  try {
    const roomData = req.body;

    // Handle file upload
    if (req.file) {
      roomData.image_360_url = `/uploads/showroom/${req.file.filename}`;

      // Create thumbnail
      const thumbnailFilename = `thumb-${req.file.filename}`;
      const thumbnailPath = path.join(__dirname, '..', 'uploads', 'showroom', thumbnailFilename);

      await sharp(req.file.path)
        .resize(400, 200, { fit: 'cover' })
        .toFile(thumbnailPath);

      roomData.thumbnail_url = `/uploads/showroom/${thumbnailFilename}`;
    } else if (!roomData.image_360_url) {
      return res.status(400).json({ error: '360° image is required' });
    }

    // Parse boolean fields
    if (roomData.is_enabled !== undefined) {
      roomData.is_enabled = roomData.is_enabled === 'true' || roomData.is_enabled === true;
    }
    if (roomData.is_starting_room !== undefined) {
      roomData.is_starting_room = roomData.is_starting_room === 'true' || roomData.is_starting_room === true;
    }

    // Parse numeric fields
    if (roomData.display_order) roomData.display_order = parseInt(roomData.display_order);
    if (roomData.default_yaw) roomData.default_yaw = parseFloat(roomData.default_yaw);
    if (roomData.default_pitch) roomData.default_pitch = parseFloat(roomData.default_pitch);
    if (roomData.default_hfov) roomData.default_hfov = parseFloat(roomData.default_hfov);

    const room = await showroomDb.createRoom(roomData);
    res.status(201).json(room);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room: ' + error.message });
  }
});

// Update a room
router.put('/admin/rooms/:id', authenticateUser, requireRole(['admin', 'super_admin']), upload.single('image360'), async (req, res) => {
  try {
    const updates = req.body;

    // Handle file upload
    if (req.file) {
      // Delete old image if exists
      const oldRoom = await showroomDb.getRoomById(parseInt(req.params.id));
      if (oldRoom && oldRoom.image_360_url) {
        const oldPath = path.join(__dirname, '..', oldRoom.image_360_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
        if (oldRoom.thumbnail_url) {
          const oldThumbPath = path.join(__dirname, '..', oldRoom.thumbnail_url);
          if (fs.existsSync(oldThumbPath)) {
            fs.unlinkSync(oldThumbPath);
          }
        }
      }

      updates.image_360_url = `/uploads/showroom/${req.file.filename}`;

      // Create thumbnail
      const thumbnailFilename = `thumb-${req.file.filename}`;
      const thumbnailPath = path.join(__dirname, '..', 'uploads', 'showroom', thumbnailFilename);

      await sharp(req.file.path)
        .resize(400, 200, { fit: 'cover' })
        .toFile(thumbnailPath);

      updates.thumbnail_url = `/uploads/showroom/${thumbnailFilename}`;
    }

    // Parse boolean fields
    if (updates.is_enabled !== undefined) {
      updates.is_enabled = updates.is_enabled === 'true' || updates.is_enabled === true;
    }
    if (updates.is_starting_room !== undefined) {
      updates.is_starting_room = updates.is_starting_room === 'true' || updates.is_starting_room === true;
    }

    // Parse numeric fields
    if (updates.display_order) updates.display_order = parseInt(updates.display_order);
    if (updates.default_yaw) updates.default_yaw = parseFloat(updates.default_yaw);
    if (updates.default_pitch) updates.default_pitch = parseFloat(updates.default_pitch);
    if (updates.default_hfov) updates.default_hfov = parseFloat(updates.default_hfov);

    const room = await showroomDb.updateRoom(parseInt(req.params.id), updates);
    res.json(room);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room: ' + error.message });
  }
});

// Delete a room
router.delete('/admin/rooms/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const room = await showroomDb.getRoomById(parseInt(req.params.id));

    // Delete associated images
    if (room) {
      if (room.image_360_url) {
        const imagePath = path.join(__dirname, '..', room.image_360_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      if (room.thumbnail_url) {
        const thumbPath = path.join(__dirname, '..', room.thumbnail_url);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }
    }

    await showroomDb.deleteRoom(parseInt(req.params.id));
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Update room display order
router.put('/admin/rooms/order', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { roomOrders } = req.body; // Array of { id, display_order }
    await showroomDb.updateRoomOrder(roomOrders);
    res.json({ success: true, message: 'Room order updated' });
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error updating room order:', error);
    res.status(500).json({ error: 'Failed to update room order' });
  }
});

// ==================== ADMIN ROUTES - HOTSPOTS ====================

// Get hotspots for a room
router.get('/admin/rooms/:roomId/hotspots', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const hotspots = await showroomDb.getHotspotsByRoomId(parseInt(req.params.roomId), false);
    res.json(hotspots);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching hotspots:', error);
    res.status(500).json({ error: 'Failed to fetch hotspots' });
  }
});

// Create a hotspot
router.post('/admin/hotspots', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const hotspotData = req.body;

    // Parse boolean fields
    if (hotspotData.is_enabled !== undefined) {
      hotspotData.is_enabled = hotspotData.is_enabled === 'true' || hotspotData.is_enabled === true;
    }

    // Parse numeric fields
    if (hotspotData.room_id) hotspotData.room_id = parseInt(hotspotData.room_id);
    if (hotspotData.position_yaw) hotspotData.position_yaw = parseFloat(hotspotData.position_yaw);
    if (hotspotData.position_pitch) hotspotData.position_pitch = parseFloat(hotspotData.position_pitch);
    if (hotspotData.link_room_id) hotspotData.link_room_id = parseInt(hotspotData.link_room_id);

    const hotspot = await showroomDb.createHotspot(hotspotData);
    res.status(201).json(hotspot);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error creating hotspot:', error);
    res.status(500).json({ error: 'Failed to create hotspot: ' + error.message });
  }
});

// Update a hotspot
router.put('/admin/hotspots/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const updates = req.body;

    // Parse boolean fields
    if (updates.is_enabled !== undefined) {
      updates.is_enabled = updates.is_enabled === 'true' || updates.is_enabled === true;
    }

    // Parse numeric fields
    if (updates.room_id) updates.room_id = parseInt(updates.room_id);
    if (updates.position_yaw) updates.position_yaw = parseFloat(updates.position_yaw);
    if (updates.position_pitch) updates.position_pitch = parseFloat(updates.position_pitch);
    if (updates.link_room_id) updates.link_room_id = parseInt(updates.link_room_id);

    const hotspot = await showroomDb.updateHotspot(parseInt(req.params.id), updates);
    res.json(hotspot);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error updating hotspot:', error);
    res.status(500).json({ error: 'Failed to update hotspot: ' + error.message });
  }
});

// Delete a hotspot
router.delete('/admin/hotspots/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    await showroomDb.deleteHotspot(parseInt(req.params.id));
    res.json({ success: true, message: 'Hotspot deleted successfully' });
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error deleting hotspot:', error);
    res.status(500).json({ error: 'Failed to delete hotspot' });
  }
});

// ==================== ADMIN ROUTES - SETTINGS ====================

// Get showroom settings
router.get('/admin/settings', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const settings = await showroomDb.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update showroom settings
router.put('/admin/settings', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const updates = req.body;

    // Parse boolean fields
    if (updates.vr_mode_enabled !== undefined) {
      updates.vr_mode_enabled = updates.vr_mode_enabled === 'true' || updates.vr_mode_enabled === true;
    }
    if (updates.auto_rotate_enabled !== undefined) {
      updates.auto_rotate_enabled = updates.auto_rotate_enabled === 'true' || updates.auto_rotate_enabled === true;
    }
    if (updates.show_compass !== undefined) {
      updates.show_compass = updates.show_compass === 'true' || updates.show_compass === true;
    }
    if (updates.show_zoom_controls !== undefined) {
      updates.show_zoom_controls = updates.show_zoom_controls === 'true' || updates.show_zoom_controls === true;
    }
    if (updates.use_threejs_viewer !== undefined) {
      updates.use_threejs_viewer = updates.use_threejs_viewer === 'true' || updates.use_threejs_viewer === true;
    }
    if (updates.showroom_visible !== undefined) {
      updates.showroom_visible = updates.showroom_visible === 'true' || updates.showroom_visible === true;
    }

    // Parse numeric fields
    if (updates.auto_rotate_speed) updates.auto_rotate_speed = parseFloat(updates.auto_rotate_speed);
    if (updates.mouse_sensitivity) updates.mouse_sensitivity = parseFloat(updates.mouse_sensitivity);

    const settings = await showroomDb.updateSettings(updates);
    res.json(settings);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings: ' + error.message });
  }
});

// ==================== MATERIAL SWAPPING - PUBLIC ROUTES ====================

// Get full showroom data with material swapping elements
router.get('/public/full-with-materials', async (req, res) => {
  try {
    const showroomData = await showroomDb.getFullShowroomDataWithMaterials(true);
    res.json(showroomData);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching showroom data with materials:', error);
    res.status(500).json({ error: 'Failed to fetch showroom data' });
  }
});

// Get all material categories
router.get('/public/material-categories', async (req, res) => {
  try {
    const categories = await showroomDb.getMaterialCategories(true);
    res.json(categories);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching material categories:', error);
    res.status(500).json({ error: 'Failed to fetch material categories' });
  }
});

// Get materials by category slug
router.get('/public/materials', async (req, res) => {
  try {
    const { category } = req.query;
    let materials;
    if (category) {
      materials = await showroomDb.getMaterialsByCategorySlug(category, true);
    } else {
      materials = await showroomDb.getMaterials(null, true);
    }
    res.json(materials);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get swappable elements for a room
router.get('/public/rooms/:roomId/elements', async (req, res) => {
  try {
    const elements = await showroomDb.getSwappableElements(parseInt(req.params.roomId), true);
    // Parse uv_bounds JSON for each element
    elements.forEach(el => {
      if (el.uv_bounds && typeof el.uv_bounds === 'string') {
        try { el.uv_bounds = JSON.parse(el.uv_bounds); } catch (e) {}
      }
    });
    res.json(elements);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching swappable elements:', error);
    res.status(500).json({ error: 'Failed to fetch swappable elements' });
  }
});

// Get available materials for an element
router.get('/public/elements/:elementId/materials', async (req, res) => {
  try {
    const materials = await showroomDb.getMaterialsForElement(parseInt(req.params.elementId), true);
    res.json(materials);
  } catch (error) {
    console.error('[SHOWROOM] Error fetching element materials:', error);
    res.status(500).json({ error: 'Failed to fetch element materials' });
  }
});

// ==================== MATERIAL CATEGORIES - ADMIN ROUTES ====================

// Get all material categories (admin - includes disabled)
router.get('/admin/material-categories', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const categories = await showroomDb.getMaterialCategories(false);
    res.json(categories);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching material categories:', error);
    res.status(500).json({ error: 'Failed to fetch material categories' });
  }
});

// Create material category
router.post('/admin/material-categories', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { category_name_en, category_name_es, category_slug, icon, display_order, is_enabled } = req.body;
    if (!category_name_en || !category_name_es || !category_slug) {
      return res.status(400).json({ error: 'category_name_en, category_name_es, and category_slug are required' });
    }
    const category = await showroomDb.createMaterialCategory({
      category_name_en, category_name_es, category_slug, icon, display_order, is_enabled
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error creating material category:', error);
    res.status(500).json({ error: 'Failed to create material category: ' + error.message });
  }
});

// Update material category
router.put('/admin/material-categories/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const category = await showroomDb.updateMaterialCategory(parseInt(req.params.id), req.body);
    if (!category) {
      return res.status(404).json({ error: 'Material category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error updating material category:', error);
    res.status(500).json({ error: 'Failed to update material category: ' + error.message });
  }
});

// Delete material category
router.delete('/admin/material-categories/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    await showroomDb.deleteMaterialCategory(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error deleting material category:', error);
    res.status(500).json({ error: 'Failed to delete material category: ' + error.message });
  }
});

// ==================== MATERIALS - ADMIN ROUTES ====================

// Get all materials (admin - includes disabled)
router.get('/admin/materials', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { category_id } = req.query;
    const materials = await showroomDb.getMaterials(category_id ? parseInt(category_id) : null, false);
    res.json(materials);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get single material
router.get('/admin/materials/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const material = await showroomDb.getMaterialById(parseInt(req.params.id));
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching material:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// Create material (with texture upload)
router.post('/admin/materials', authenticateUser, requireRole(['admin', 'super_admin']), upload.fields([
  { name: 'texture', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'normal_map', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      category_id, material_name_en, material_name_es, material_code,
      color_hex, roughness, metalness, repeat_scale_x, repeat_scale_y,
      price_indicator, is_enabled, display_order
    } = req.body;

    if (!category_id || !material_name_en || !material_name_es) {
      return res.status(400).json({ error: 'category_id, material_name_en, and material_name_es are required' });
    }

    const materialData = {
      category_id: parseInt(category_id),
      material_name_en,
      material_name_es,
      material_code,
      color_hex,
      roughness: roughness ? parseFloat(roughness) : 0.5,
      metalness: metalness ? parseFloat(metalness) : 0.0,
      repeat_scale_x: repeat_scale_x ? parseFloat(repeat_scale_x) : 1.0,
      repeat_scale_y: repeat_scale_y ? parseFloat(repeat_scale_y) : 1.0,
      price_indicator,
      is_enabled: is_enabled !== 'false' && is_enabled !== false,
      display_order: display_order ? parseInt(display_order) : 0
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.texture && req.files.texture[0]) {
        materialData.texture_url = `/uploads/showroom/${req.files.texture[0].filename}`;
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        materialData.thumbnail_url = `/uploads/showroom/${req.files.thumbnail[0].filename}`;
      } else if (req.files.texture && req.files.texture[0]) {
        // Generate thumbnail from texture
        const textureFile = req.files.texture[0];
        const thumbFilename = `thumb-${textureFile.filename}`;
        const thumbPath = path.join(__dirname, '..', 'uploads', 'showroom', thumbFilename);
        await sharp(textureFile.path)
          .resize(200, 200, { fit: 'cover' })
          .toFile(thumbPath);
        materialData.thumbnail_url = `/uploads/showroom/${thumbFilename}`;
      }
      if (req.files.normal_map && req.files.normal_map[0]) {
        materialData.normal_map_url = `/uploads/showroom/${req.files.normal_map[0].filename}`;
      }
    }

    const material = await showroomDb.createMaterial(materialData);
    res.status(201).json(material);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error creating material:', error);
    res.status(500).json({ error: 'Failed to create material: ' + error.message });
  }
});

// Update material
router.put('/admin/materials/:id', authenticateUser, requireRole(['admin', 'super_admin']), upload.fields([
  { name: 'texture', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'normal_map', maxCount: 1 }
]), async (req, res) => {
  try {
    const updates = { ...req.body };

    // Parse numeric fields
    if (updates.category_id) updates.category_id = parseInt(updates.category_id);
    if (updates.roughness) updates.roughness = parseFloat(updates.roughness);
    if (updates.metalness) updates.metalness = parseFloat(updates.metalness);
    if (updates.repeat_scale_x) updates.repeat_scale_x = parseFloat(updates.repeat_scale_x);
    if (updates.repeat_scale_y) updates.repeat_scale_y = parseFloat(updates.repeat_scale_y);
    if (updates.display_order) updates.display_order = parseInt(updates.display_order);
    if (updates.is_enabled !== undefined) {
      updates.is_enabled = updates.is_enabled !== 'false' && updates.is_enabled !== false;
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.texture && req.files.texture[0]) {
        updates.texture_url = `/uploads/showroom/${req.files.texture[0].filename}`;
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        updates.thumbnail_url = `/uploads/showroom/${req.files.thumbnail[0].filename}`;
      }
      if (req.files.normal_map && req.files.normal_map[0]) {
        updates.normal_map_url = `/uploads/showroom/${req.files.normal_map[0].filename}`;
      }
    }

    const material = await showroomDb.updateMaterial(parseInt(req.params.id), updates);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error updating material:', error);
    res.status(500).json({ error: 'Failed to update material: ' + error.message });
  }
});

// Delete material
router.delete('/admin/materials/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const material = await showroomDb.getMaterialById(parseInt(req.params.id));
    if (material) {
      // Clean up texture files
      const uploadDir = path.join(__dirname, '..', 'uploads', 'showroom');
      if (material.texture_url) {
        const texturePath = path.join(uploadDir, path.basename(material.texture_url));
        if (fs.existsSync(texturePath)) fs.unlinkSync(texturePath);
      }
      if (material.thumbnail_url) {
        const thumbPath = path.join(uploadDir, path.basename(material.thumbnail_url));
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }
      if (material.normal_map_url) {
        const normalPath = path.join(uploadDir, path.basename(material.normal_map_url));
        if (fs.existsSync(normalPath)) fs.unlinkSync(normalPath);
      }
    }
    await showroomDb.deleteMaterial(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error deleting material:', error);
    res.status(500).json({ error: 'Failed to delete material: ' + error.message });
  }
});

// ==================== SWAPPABLE ELEMENTS - ADMIN ROUTES ====================

// Get all swappable elements (admin) - includes linked materials
router.get('/admin/elements', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { room_id } = req.query;
    const elements = await showroomDb.getSwappableElements(room_id ? parseInt(room_id) : null, false);

    // For each element, fetch linked materials and parse uv_bounds
    for (const el of elements) {
      // Parse uv_bounds JSON
      if (el.uv_bounds && typeof el.uv_bounds === 'string') {
        try { el.uv_bounds = JSON.parse(el.uv_bounds); } catch (e) {}
      }
      // Fetch linked materials for this element
      try {
        const linkedMaterials = await showroomDb.getMaterialsForElement(el.id, false);
        el.linked_materials = linkedMaterials;
      } catch (err) {
        el.linked_materials = [];
      }
    }

    res.json(elements);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching swappable elements:', error);
    res.status(500).json({ error: 'Failed to fetch swappable elements' });
  }
});

// Get single swappable element
router.get('/admin/elements/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const element = await showroomDb.getSwappableElementById(parseInt(req.params.id));
    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }
    if (element.uv_bounds && typeof element.uv_bounds === 'string') {
      try { element.uv_bounds = JSON.parse(element.uv_bounds); } catch (e) {}
    }
    // Get linked materials
    element.materials = await showroomDb.getMaterialsForElement(element.id, false);
    res.json(element);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching swappable element:', error);
    res.status(500).json({ error: 'Failed to fetch swappable element' });
  }
});

// Create swappable element
router.post('/admin/elements', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const {
      room_id, element_name_en, element_name_es, element_type,
      uv_bounds, polygon_points, highlight_color, default_material_id, is_enabled, display_order
    } = req.body;

    // Debug logging for polygon_points
    console.log('[SHOWROOM ADMIN] Create element - polygon_points:', {
      received: !!polygon_points,
      type: typeof polygon_points,
      value: polygon_points ? (polygon_points.length || 'string') : null
    });

    if (!room_id || !element_name_en || !element_name_es || !element_type || !uv_bounds) {
      return res.status(400).json({
        error: 'room_id, element_name_en, element_name_es, element_type, and uv_bounds are required'
      });
    }

    const element = await showroomDb.createSwappableElement({
      room_id: parseInt(room_id),
      element_name_en,
      element_name_es,
      element_type,
      uv_bounds,
      polygon_points, // Include polygon_points from 3D selection
      highlight_color,
      default_material_id: default_material_id ? parseInt(default_material_id) : null,
      is_enabled: is_enabled !== 'false' && is_enabled !== false,
      display_order: display_order ? parseInt(display_order) : 0
    });

    // Parse uv_bounds for response
    if (element.uv_bounds && typeof element.uv_bounds === 'string') {
      try { element.uv_bounds = JSON.parse(element.uv_bounds); } catch (e) {}
    }

    res.status(201).json(element);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error creating swappable element:', error);
    res.status(500).json({ error: 'Failed to create swappable element: ' + error.message });
  }
});

// Update swappable element
router.put('/admin/elements/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const updates = { ...req.body };

    // Debug logging for polygon_points
    console.log('[SHOWROOM ADMIN] Update element', req.params.id, '- polygon_points:', {
      present: 'polygon_points' in updates,
      type: typeof updates.polygon_points,
      value: updates.polygon_points ? (typeof updates.polygon_points === 'string' ? 'JSON string' : updates.polygon_points.length + ' points') : null
    });

    // Parse numeric fields
    if (updates.room_id) updates.room_id = parseInt(updates.room_id);
    if (updates.default_material_id) updates.default_material_id = parseInt(updates.default_material_id);
    if (updates.display_order) updates.display_order = parseInt(updates.display_order);
    if (updates.is_enabled !== undefined) {
      updates.is_enabled = updates.is_enabled !== 'false' && updates.is_enabled !== false;
    }

    const element = await showroomDb.updateSwappableElement(parseInt(req.params.id), updates);
    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }

    // Parse uv_bounds for response
    if (element.uv_bounds && typeof element.uv_bounds === 'string') {
      try { element.uv_bounds = JSON.parse(element.uv_bounds); } catch (e) {}
    }

    res.json(element);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error updating swappable element:', error);
    res.status(500).json({ error: 'Failed to update swappable element: ' + error.message });
  }
});

// Delete swappable element
router.delete('/admin/elements/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    await showroomDb.deleteSwappableElement(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error deleting swappable element:', error);
    res.status(500).json({ error: 'Failed to delete swappable element: ' + error.message });
  }
});

// ==================== ELEMENT-MATERIAL LINKS - ADMIN ROUTES ====================

// Get materials linked to an element
router.get('/admin/elements/:id/materials', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const materials = await showroomDb.getMaterialsForElement(parseInt(req.params.id), false);
    res.json(materials);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error fetching element materials:', error);
    res.status(500).json({ error: 'Failed to fetch element materials' });
  }
});

// Link material to element
router.post('/admin/elements/:id/link-material', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { material_id, is_default } = req.body;
    if (!material_id) {
      return res.status(400).json({ error: 'material_id is required' });
    }
    await showroomDb.linkMaterialToElement(
      parseInt(req.params.id),
      parseInt(material_id),
      is_default === true || is_default === 'true'
    );
    const materials = await showroomDb.getMaterialsForElement(parseInt(req.params.id), false);
    res.json(materials);
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error linking material to element:', error);
    res.status(500).json({ error: 'Failed to link material to element: ' + error.message });
  }
});

// Unlink material from element
router.delete('/admin/elements/:elementId/unlink-material/:materialId', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    await showroomDb.unlinkMaterialFromElement(
      parseInt(req.params.elementId),
      parseInt(req.params.materialId)
    );
    res.json({ success: true });
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error unlinking material from element:', error);
    res.status(500).json({ error: 'Failed to unlink material from element: ' + error.message });
  }
});

// Set default material for element
router.put('/admin/elements/:id/default-material', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { material_id } = req.body;
    if (!material_id) {
      return res.status(400).json({ error: 'material_id is required' });
    }
    await showroomDb.setDefaultMaterialForElement(
      parseInt(req.params.id),
      parseInt(material_id)
    );
    res.json({ success: true });
  } catch (error) {
    console.error('[SHOWROOM ADMIN] Error setting default material:', error);
    res.status(500).json({ error: 'Failed to set default material: ' + error.message });
  }
});

// ==================== SEED DEMO DATA - ADMIN ROUTE ====================
// Populates test data with 3DVista demo panoramas for testing
router.post('/admin/seed-demo', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    console.log('[SHOWROOM] Seeding demo data...');

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, '..', 'uploads', 'showroom');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Demo panorama source files from 3DVista
    const demoSourceDir = path.join(__dirname, '..', '..', '3dvistademo', 'Casa Cascada light', 'media', 'panoramas');

    // Helper to copy demo panorama to uploads folder
    const copyPanorama = (sourceName, destName) => {
      const sourcePath = path.join(demoSourceDir, sourceName);
      const destPath = path.join(uploadDir, destName);
      try {
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`[SHOWROOM] Copied panorama: ${sourceName} -> ${destName}`);
          return `/uploads/showroom/${destName}`;
        }
      } catch (err) {
        console.warn(`[SHOWROOM] Could not copy ${sourceName}:`, err.message);
      }
      // Fallback to static demo path if copy fails
      return `/demo-panoramas/Casa Cascada light/media/panoramas/${sourceName}`;
    };

    // Enable Three.js viewer in settings
    await showroomDb.updateSettings({ use_threejs_viewer: true });

    // Add demo rooms with copied panoramas (saved to uploads for proper DB storage)
    const demoRooms = [
      {
        room_name_en: 'Living Room',
        room_name_es: 'Sala de Estar',
        room_description_en: 'Modern living room with panoramic views',
        room_description_es: 'Sala de estar moderna con vistas panorámicas',
        image_360_url: copyPanorama('pano1.jpg', 'demo-living-room.jpg'),
        category: 'showroom',
        is_enabled: true,
        is_starting_room: true,
        default_yaw: 0,
        default_pitch: 0,
        default_hfov: 100
      },
      {
        room_name_en: 'Entry Hall',
        room_name_es: 'Vestíbulo de Entrada',
        room_description_en: 'Elegant entry with designer finishes',
        room_description_es: 'Elegante entrada con acabados de diseñador',
        image_360_url: copyPanorama('pano9.jpg', 'demo-entry-hall.jpg'),
        category: 'showroom',
        is_enabled: true,
        is_starting_room: false,
        default_yaw: 0,
        default_pitch: 0,
        default_hfov: 100
      },
      {
        room_name_en: 'Master Bedroom',
        room_name_es: 'Dormitorio Principal',
        room_description_en: 'Luxurious master suite',
        room_description_es: 'Suite principal de lujo',
        image_360_url: copyPanorama('pano10.jpg', 'demo-master-bedroom.jpg'),
        category: 'showroom',
        is_enabled: true,
        is_starting_room: false,
        default_yaw: 0,
        default_pitch: 0,
        default_hfov: 100
      }
    ];

    const createdRooms = [];
    for (const room of demoRooms) {
      const created = await showroomDb.createRoom(room);
      createdRooms.push(created);
    }

    // Add material categories
    const categories = [
      { category_name_en: 'Flooring', category_name_es: 'Pisos', category_slug: 'flooring', icon: 'floor', display_order: 1, is_enabled: true },
      { category_name_en: 'Countertops', category_name_es: 'Encimeras', category_slug: 'countertops', icon: 'counter', display_order: 2, is_enabled: true },
      { category_name_en: 'Cabinet Finishes', category_name_es: 'Acabados de Gabinetes', category_slug: 'cabinet-finishes', icon: 'cabinet', display_order: 3, is_enabled: true },
      { category_name_en: 'Wall Colors', category_name_es: 'Colores de Pared', category_slug: 'wall-colors', icon: 'wall', display_order: 4, is_enabled: true }
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const created = await showroomDb.createMaterialCategory(cat);
      createdCategories.push(created);
    }

    // Add sample materials
    const materials = [
      // Flooring
      { category_id: createdCategories[0].id, material_name_en: 'Oak Hardwood', material_name_es: 'Roble', material_code: 'FLR-OAK-001', color_hex: '#8B7355', roughness: 0.7, metalness: 0, price_indicator: '$$', is_enabled: true, display_order: 1 },
      { category_id: createdCategories[0].id, material_name_en: 'Walnut Hardwood', material_name_es: 'Nogal', material_code: 'FLR-WAL-001', color_hex: '#5C4033', roughness: 0.7, metalness: 0, price_indicator: '$$$', is_enabled: true, display_order: 2 },
      { category_id: createdCategories[0].id, material_name_en: 'Light Maple', material_name_es: 'Arce Claro', material_code: 'FLR-MAP-001', color_hex: '#E8D4A8', roughness: 0.6, metalness: 0, price_indicator: '$$', is_enabled: true, display_order: 3 },
      { category_id: createdCategories[0].id, material_name_en: 'Gray Tile', material_name_es: 'Baldosa Gris', material_code: 'FLR-TIL-001', color_hex: '#808080', roughness: 0.3, metalness: 0.1, price_indicator: '$$', is_enabled: true, display_order: 4 },
      // Countertops
      { category_id: createdCategories[1].id, material_name_en: 'White Marble', material_name_es: 'Mármol Blanco', material_code: 'CNT-MRB-001', color_hex: '#F5F5F5', roughness: 0.2, metalness: 0.1, price_indicator: '$$$$', is_enabled: true, display_order: 1 },
      { category_id: createdCategories[1].id, material_name_en: 'Black Granite', material_name_es: 'Granito Negro', material_code: 'CNT-GRN-001', color_hex: '#1C1C1C', roughness: 0.3, metalness: 0.2, price_indicator: '$$$', is_enabled: true, display_order: 2 },
      { category_id: createdCategories[1].id, material_name_en: 'Butcher Block', material_name_es: 'Bloque de Carnicero', material_code: 'CNT-WOD-001', color_hex: '#C4A76C', roughness: 0.8, metalness: 0, price_indicator: '$$', is_enabled: true, display_order: 3 },
      { category_id: createdCategories[1].id, material_name_en: 'Quartz White', material_name_es: 'Cuarzo Blanco', material_code: 'CNT-QTZ-001', color_hex: '#FAFAFA', roughness: 0.15, metalness: 0.05, price_indicator: '$$$', is_enabled: true, display_order: 4 },
      // Cabinet Finishes
      { category_id: createdCategories[2].id, material_name_en: 'White Shaker', material_name_es: 'Blanco Shaker', material_code: 'CAB-WHT-001', color_hex: '#FFFFFF', roughness: 0.4, metalness: 0, price_indicator: '$$', is_enabled: true, display_order: 1 },
      { category_id: createdCategories[2].id, material_name_en: 'Navy Blue', material_name_es: 'Azul Marino', material_code: 'CAB-NVY-001', color_hex: '#1E3A5F', roughness: 0.4, metalness: 0, price_indicator: '$$$', is_enabled: true, display_order: 2 },
      { category_id: createdCategories[2].id, material_name_en: 'Natural Wood', material_name_es: 'Madera Natural', material_code: 'CAB-NAT-001', color_hex: '#A67B5B', roughness: 0.6, metalness: 0, price_indicator: '$$', is_enabled: true, display_order: 3 },
      { category_id: createdCategories[2].id, material_name_en: 'Charcoal Gray', material_name_es: 'Gris Carbón', material_code: 'CAB-GRY-001', color_hex: '#36454F', roughness: 0.35, metalness: 0, price_indicator: '$$', is_enabled: true, display_order: 4 },
      // Wall Colors
      { category_id: createdCategories[3].id, material_name_en: 'Pure White', material_name_es: 'Blanco Puro', material_code: 'WLL-WHT-001', color_hex: '#FFFFFF', roughness: 0.9, metalness: 0, price_indicator: '$', is_enabled: true, display_order: 1 },
      { category_id: createdCategories[3].id, material_name_en: 'Warm Beige', material_name_es: 'Beige Cálido', material_code: 'WLL-BGE-001', color_hex: '#F5DEB3', roughness: 0.9, metalness: 0, price_indicator: '$', is_enabled: true, display_order: 2 },
      { category_id: createdCategories[3].id, material_name_en: 'Sage Green', material_name_es: 'Verde Salvia', material_code: 'WLL-GRN-001', color_hex: '#9CAF88', roughness: 0.9, metalness: 0, price_indicator: '$', is_enabled: true, display_order: 3 },
      { category_id: createdCategories[3].id, material_name_en: 'Light Gray', material_name_es: 'Gris Claro', material_code: 'WLL-GRY-001', color_hex: '#D3D3D3', roughness: 0.9, metalness: 0, price_indicator: '$', is_enabled: true, display_order: 4 }
    ];

    const createdMaterials = [];
    for (const mat of materials) {
      const created = await showroomDb.createMaterial(mat);
      createdMaterials.push(created);
    }

    // Add swappable elements for the first room (Living Room)
    const elements = [
      {
        room_id: createdRooms[0].id,
        element_name_en: 'Floor',
        element_name_es: 'Piso',
        element_type: 'surface',
        uv_bounds: JSON.stringify({ minU: 0.0, maxU: 1.0, minV: 0.65, maxV: 0.95 }),
        highlight_color: '#f59e0b',
        is_enabled: true,
        display_order: 1
      },
      {
        room_id: createdRooms[0].id,
        element_name_en: 'Left Wall',
        element_name_es: 'Pared Izquierda',
        element_type: 'surface',
        uv_bounds: JSON.stringify({ minU: 0.0, maxU: 0.25, minV: 0.2, maxV: 0.65 }),
        highlight_color: '#3b82f6',
        is_enabled: true,
        display_order: 2
      }
    ];

    const createdElements = [];
    for (const el of elements) {
      const created = await showroomDb.createSwappableElement(el);
      createdElements.push(created);
    }

    // Link materials to elements
    // Floor element - link flooring materials
    const floorMaterials = createdMaterials.filter(m => m.category_id === createdCategories[0].id);
    for (const mat of floorMaterials) {
      await showroomDb.linkMaterialToElement(createdElements[0].id, mat.id, mat === floorMaterials[0]);
    }

    // Wall element - link wall color materials
    const wallMaterials = createdMaterials.filter(m => m.category_id === createdCategories[3].id);
    for (const mat of wallMaterials) {
      await showroomDb.linkMaterialToElement(createdElements[1].id, mat.id, mat === wallMaterials[0]);
    }

    // Add hotspots to link rooms
    if (createdRooms.length > 1) {
      await showroomDb.createHotspot({
        room_id: createdRooms[0].id,
        hotspot_type: 'link_room',
        title_en: 'Go to Entry Hall',
        title_es: 'Ir al Vestíbulo',
        position_yaw: 90,
        position_pitch: -5,
        link_room_id: createdRooms[1].id,
        is_enabled: true
      });
      await showroomDb.createHotspot({
        room_id: createdRooms[1].id,
        hotspot_type: 'link_room',
        title_en: 'Go to Living Room',
        title_es: 'Ir a la Sala',
        position_yaw: -90,
        position_pitch: -5,
        link_room_id: createdRooms[0].id,
        is_enabled: true
      });
    }

    console.log('[SHOWROOM] Demo data seeded successfully');
    res.json({
      success: true,
      message: 'Demo data seeded successfully',
      data: {
        rooms: createdRooms.length,
        categories: createdCategories.length,
        materials: createdMaterials.length,
        elements: createdElements.length
      }
    });
  } catch (error) {
    console.error('[SHOWROOM] Error seeding demo data:', error);
    res.status(500).json({ error: 'Failed to seed demo data: ' + error.message });
  }
});

// Clear all showroom demo data
router.delete('/admin/clear-demo', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    console.log('[SHOWROOM] Clearing demo data...');

    // Delete in correct order to respect foreign keys
    const db = showroomDb.getDb();

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM showroom_element_material_links', [], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM showroom_swappable_elements', [], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM showroom_materials', [], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM showroom_material_categories', [], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM showroom_hotspots', [], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM showroom_rooms', [], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    console.log('[SHOWROOM] Demo data cleared');
    res.json({ success: true, message: 'Demo data cleared successfully' });
  } catch (error) {
    console.error('[SHOWROOM] Error clearing demo data:', error);
    res.status(500).json({ error: 'Failed to clear demo data: ' + error.message });
  }
});

module.exports = router;

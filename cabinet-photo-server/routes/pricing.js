// This file contains all pricing-related API endpoints
// REQUIRED IMPORTS 
const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/auth");
const { getDb, queueDbOperation } = require("../db-helpers");
// Get all the pricing data
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    // Get cabinet prices
    const cabinetPrices = await db.all("SELECT * FROM cabinet_prices");
    const basePrices = {};
    cabinetPrices.forEach((item) => {
      basePrices[item.cabinet_type] = parseFloat(item.base_price);
    });
    // Get material multipliers - return new bilingual array format
    const materials = await db.all("SELECT * FROM material_pricing");
    const materialMultipliers = materials.map((item) => ({
      id: item.id,
      nameEn: item.material_name_en,
      nameEs: item.material_name_es,
      multiplier: parseFloat(item.multiplier),
    }));
    // Get color pricing
    const colors = await db.all("SELECT * FROM color_pricing");
    const colorPricing = {};
    colors.forEach((item) => {
      const key = isNaN(item.color_count)
        ? item.color_count
        : parseInt(item.color_count);
      colorPricing[key] = parseFloat(item.price_addition);
    });
    // Get wall pricing
    let wallPricing = { addWall: 1500, removeWall: 2000 };
    try {
      const walls = await db.all("SELECT * FROM wall_pricing");
      if (walls.length > 0) {
        wallPricing = {};
        walls.forEach((item) => {
          wallPricing[item.modification_type] = parseFloat(item.price);
        });
      }
    } catch (wallError) {
      console.log("Wall pricing table does not exist yet, using defaults");
    }
    console.log("Loaded prices with materials:", {
      basePrices,
      materialMultipliers,
      colorPricing,
      wallPricing,
    });
    res.json({
      basePrices,
      materialMultipliers,
      colorPricing,
      wallPricing,
    });
  } catch (error) {
    console.error("Error loading prices:", error);
    res.status(500).json({ error: "Failed to load prices" });
  }
});
// Update the cabinet prices
router.put("/cabinets", async (req, res) => {
  try {
    const prices = req.body;
    console.log("Updating cabinet prices:", prices);
    await queueDbOperation(async () => {
      const db = await getDb();
      // Use a transaction for consistency
      await db.run("BEGIN TRANSACTION");
      try {
        // Update each cabinet price
        for (const [cabinetType, price] of Object.entries(prices)) {
          await db.run(
            `UPDATE cabinet_prices 
             SET base_price = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE cabinet_type = ?`,
            [price, cabinetType]
          );
        }
        await db.run("COMMIT");
      } 
      catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    });
    res.json({ success: true, message: "Cabinet prices updated successfully" });
  } catch (error) {
    console.error("Error updating cabinet prices:", error);
    res.status(500).json({ error: "Failed to update cabinet prices" });
  }
});
router.get("/cabinets", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      "SELECT * FROM cabinet_prices ORDER BY cabinet_type"
    );
    const cabinets = {};
    rows.forEach((row) => {
      cabinets[row.cabinet_type] = parseFloat(row.base_price);
    });
    console.log("Loaded cabinet prices:", cabinets);
    res.json(cabinets);
  } catch (error) {
    console.error("Error fetching cabinet prices:", error);
    res.status(500).json({ error: "Failed to fetch cabinet prices" });
  }
});
router.get("/materials", async (req, res) => {
  try {
    const db = await getDb();
    const materials = await db.all(
      "SELECT * FROM material_pricing ORDER BY material_name_en"
    );
    // Return bilingual format for frontend
    const materialArray = materials.map((m) => ({
      id: m.id,
      nameEn: m.material_name_en,
      nameEs: m.material_name_es,
      multiplier: parseFloat(m.multiplier),
      updated_at: m.updated_at,
      updated_by: m.updated_by,
    }));
    //await db.close();
    console.log("Loaded materials:", materialArray);
    res.json(materialArray);
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});
// Update the material multipliers
router.put("/materials", async (req, res) => {
  try {
    const materials = req.body;
    console.log("Saving materials:", materials);
    await queueDbOperation(async () => {
      const db = await getDb();
      // Start a transaction
      await db.run("BEGIN TRANSACTION");
      try {
        // Delete all existing materials
        await db.run("DELETE FROM material_pricing");
        // Insert all materials (including new ones)
        const stmt = await db.prepare(
          "INSERT INTO material_pricing (material_name_en, material_name_es, multiplier) VALUES (?, ?, ?)"
        );
        for (const material of materials) {
          await stmt.run(material.nameEn, material.nameEs, material.multiplier);
          console.log(
            `Inserted material: ${material.nameEn}/${material.nameEs} with multiplier: ${material.multiplier}`
          );
        }
        await stmt.finalize();
        await db.run("COMMIT");
        console.log("Materials saved successfully");
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    });
    res.json({ success: true, message: "Materials saved successfully" });
  } catch (error) {
    console.error("Error saving materials:", error);
    res
      .status(500)
      .json({ error: "Failed to save materials: " + error.message });
  }
});
// Update the color pricing
router.put("/colors", async (req, res) => {
  try {
    const colors = req.body;
    console.log("Updating color pricing:", colors);

    await queueDbOperation(async () => {
      const db = await getDb();
      // Use a transaction for consistency
      await db.run("BEGIN TRANSACTION");
      try {
        // Update each color price
        for (const [colorCount, price] of Object.entries(colors)) {
          await db.run(
            `UPDATE color_pricing 
             SET price_addition = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE color_count = ?`,
            [price, colorCount]
          );
        }
        await db.run("COMMIT");
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    });
    res.json({ success: true, message: "Color pricing updated successfully" });
  } catch (error) {
    console.error("Error updating color pricing:", error);
    res.status(500).json({ error: "Failed to update color pricing" });
  }
});
router.get("/colors", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      "SELECT * FROM color_pricing ORDER BY color_count"
    );
    const colors = {};
    rows.forEach((row) => {
      const key = isNaN(row.color_count)
        ? row.color_count
        : parseInt(row.color_count);
      colors[key] = parseFloat(row.price_addition);
    });
    console.log("Loaded color pricing:", colors);
    res.json(colors);
  } catch (error) {
    console.error("Error fetching color pricing:", error);
    res.status(500).json({ error: "Failed to fetch color pricing" });
  }
});
router.get("/history", async (req, res) => {
  try {
    const db = await getDb();
    const history = await db.all(`
      SELECT 'cabinet' as type, cabinet_type as item, base_price as value, updated_at 
      FROM cabinet_prices 
      UNION ALL
      SELECT 'material' as type, (material_name_en || ' / ' || material_name_es) as item, multiplier as value, updated_at 
      FROM material_pricing
      UNION ALL
      SELECT 'color' as type, color_count as item, price_addition as value, updated_at 
      FROM color_pricing
      ORDER BY updated_at DESC
      LIMIT 50
    `);
    res.json(history);
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});
// Wall pricing endpoints
router.get("/walls", async (req, res) => {
  try {
    const db = await getDb();
    // Ensure wall_pricing table exists
    await db.run(`
      CREATE TABLE IF NOT EXISTS wall_pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modification_type TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Try to get wall pricing from database
    const rows = await db.all(
      "SELECT * FROM wall_pricing ORDER BY modification_type"
    );
    const walls = {};
    if (rows.length > 0) {
      rows.forEach((row) => {
        walls[row.modification_type] = parseFloat(row.price);
      });
    } else {
      // Return default values if no data in database
      walls.addWall = 1500;
      walls.removeWall = 2000;
    }
    console.log("Loaded wall pricing:", walls);
    res.json(walls);
  } catch (error) {
    console.error("Error fetching wall pricing:", error);
    // Return defaults on error
    res.json({ addWall: 1500, removeWall: 2000 });
  }
});
router.put("/walls", async (req, res) => {
  try {
    const wallPricing = req.body;
    console.log("Updating wall pricing:", wallPricing);
    await queueDbOperation(async () => {
      const db = await getDb();
      // Ensure wall_pricing table exists
      await db.run(`
        CREATE TABLE IF NOT EXISTS wall_pricing (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          modification_type TEXT UNIQUE NOT NULL,
          price REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Use a transaction for better performance and consistency
      await db.run("BEGIN TRANSACTION");
      try {
        // Update each wall price (using REPLACE to handle both INSERT and UPDATE)
        for (const [modificationType, price] of Object.entries(wallPricing)) {
          await db.run(
            `
            REPLACE INTO wall_pricing (modification_type, price, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `,
            [modificationType, price]
          );
        }

        await db.run("COMMIT");
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    });
    console.log("Wall pricing updated successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating wall pricing:", error);
    res.status(500).json({ error: "Failed to update wall pricing" });
  }
});
// Wall availability endpoints
router.get("/wall-availability", async (req, res) => {
  try {
    const db = await getDb();

    // Try to get wall availability from database
    const rows = await db.all(
      "SELECT * FROM wall_availability ORDER BY service_type"
    );
    const availability = {};
    if (rows.length > 0) {
      rows.forEach((row) => {
        availability[row.service_type + "Enabled"] = Boolean(row.is_enabled);
      });
    } else {
      // Default values if table is empty
      availability.addWallEnabled = true;
      availability.removeWallEnabled = true;
    }
    //await db.close();
    res.json(availability);
  } catch (error) {
    console.error("Error fetching wall availability:", error);
    // Return defaults on error
    res.json({
      addWallEnabled: true,
      removeWallEnabled: true,
    });
  }
});
router.put("/wall-availability", async (req, res) => {
  try {
    const db = await getDb();
    const wallAvailability = req.body;
    console.log("Updating wall availability:", wallAvailability);
    // Ensure wall_availability table exists
    await db.run(`
      CREATE TABLE IF NOT EXISTS wall_availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_type TEXT UNIQUE NOT NULL,
        is_enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Update each wall availability setting
    for (const [key, enabled] of Object.entries(wallAvailability)) {
      const serviceType = key.replace("Enabled", "");
      await db.run(
        `
        REPLACE INTO wall_availability (service_type, is_enabled, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
        [serviceType, enabled ? 1 : 0]
      );
    }
    //await db.close();
    console.log("Wall availability updated successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating wall availability:", error);
    res.status(500).json({ error: "Failed to update wall availability" });
  }
});
// EXPORTS
module.exports = router;

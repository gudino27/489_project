require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

// Import database helpers
const {
  getDb,
  queueDbOperation,
  photoDb,
  employeeDb,
  designDb,
  userDb,
  analyticsDb,
  testimonialDb,
  invoiceDb,
} = require("./db-helpers");

// Import routes
const photosRoutes = require("./routes/photos");
const employeesRoutes = require("./routes/employees");
const pricingRoutes = require("./routes/pricing");
const designsRoutes = require("./routes/designs");
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");
const invoicesRoutes = require("./routes/invoices");
const adminInvoicesRoutes = require("./routes/admin/invoices");
const testimonialsRoutes = require("./routes/testimonials");
const adminTestimonialsRoutes = require("./routes/admin/testimonials");
const pushTokensRoutes = require("./routes/push-tokens");
const timeclockRoutes = require("./routes/timeclock");
const adminRoutes = require("./routes/admin");
const miscRoutes = require("./routes/misc");

const app = express();

// Trust proxy - this allows Express to read X-Forwarded-For headers from nginx
app.set('trust proxy', true);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://gudinocustom.com",
      "https://www.gudinocustom.com",
      "https://api.gudinocustom.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing middleware
app.use(express.json());

// Special middleware for analytics sendBeacon (text/plain)
app.use("/api/analytics/time", express.text({ type: "text/plain" }));
app.use("/api/analytics/time", (req, res, next) => {
  if (
    req.headers["content-type"] === "text/plain" &&
    typeof req.body === "string"
  ) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON in request body" });
    }
  }
  next();
});

// Serve static files from uploads directory
app.use("/photos", express.static(path.join(__dirname, "uploads")));
app.use("/testimonial-photos", express.static(path.join(__dirname, "uploads", "testimonial-photos")));

// Mount routes
app.use("/api/photos", photosRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/prices", pricingRoutes);
app.use("/api/designs", designsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/invoice", invoicesRoutes); 
app.use("/api/admin/invoices", adminInvoicesRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/admin/push-tokens", pushTokensRoutes);
app.use("/api/timeclock", timeclockRoutes);
app.use("/api/admin", adminTestimonialsRoutes);
app.use("/", adminRoutes);
app.use("/", miscRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📂 Upload directory: ${path.join(__dirname, "uploads")}`);
});

module.exports = app;

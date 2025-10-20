const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cabinet-photo-server', 'database', 'cabinet_photos.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking payroll data in database...\n');

// Check if table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='employee_payroll_info'", (err, row) => {
  if (err) {
    console.error('Error checking table:', err);
    return;
  }
  
  if (!row) {
    console.log('❌ employee_payroll_info table does NOT exist!');
    db.close();
    return;
  }
  
  console.log('✅ employee_payroll_info table exists\n');
  
  // Check for active records
  db.all("SELECT * FROM employee_payroll_info WHERE is_active = 1", (err, rows) => {
    if (err) {
      console.error('Error querying payroll:', err);
      db.close();
      return;
    }
    
    console.log(`Found ${rows.length} active payroll record(s)\n`);
    
    if (rows.length === 0) {
      console.log('⚠️  No payroll data has been set yet!');
      console.log('📝 Action needed: Admin must set payroll info for employees\n');
    } else {
      rows.forEach(row => {
        console.log('Employee ID:', row.employee_id);
        console.log('  Type:', row.employment_type);
        if (row.employment_type === 'hourly') {
          console.log('  Hourly Rate: $' + row.hourly_rate);
          console.log('  OT Rate: $' + row.overtime_rate);
        } else {
          console.log('  Salary: $' + row.salary);
        }
        console.log('  Pay Period:', row.pay_period_type);
        console.log('  Tax Rate:', row.save_tax_rate + '%');
        console.log('');
      });
    }
    
    // Also check users
    db.all("SELECT id, username, full_name, role FROM users", (err, users) => {
      if (err) {
        console.error('Error querying users:', err);
      } else {
        console.log(`\nTotal users in database: ${users.length}`);
        users.forEach(user => {
          console.log(`  ${user.id}: ${user.full_name} (${user.username}) - ${user.role}`);
        });
      }
      db.close();
    });
  });
});

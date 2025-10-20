const { getDb } = require('./db-helpers');

async function checkPayroll() {
  console.log('Checking payroll data in database...\n');
  
  const db = await getDb();
  
  try {
    // Check if table exists
    const table = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='employee_payroll_info'");
    
    if (!table) {
      console.log('❌ employee_payroll_info table does NOT exist!');
      return;
    }
    
    console.log('✅ employee_payroll_info table exists\n');
    
    // Check for active records
    const rows = await db.all("SELECT * FROM employee_payroll_info WHERE is_active = 1");
    
    console.log(`Found ${rows.length} active payroll record(s)\n`);
    
    if (rows.length === 0) {
      console.log('⚠️  NO PAYROLL DATA HAS BEEN SET YET!');
      console.log('📝 Action needed: Admin must set payroll info for employees');
      console.log('   1. Login as admin/super admin');
      console.log('   2. Go to Time Clock tab');
      console.log('   3. Click "Admin View"');
      console.log('   4. Click "Show" on Employee Payroll Management');
      console.log('   5. Click "Set Payroll Info" for each employee\n');
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
        console.log('  Tax Rate:', (row.save_tax_rate || 0) + '%');
        console.log('');
      });
    }
    
    // Also check users
    const users = await db.all("SELECT id, username, full_name, role FROM users");
    console.log(`\nTotal users in database: ${users.length}`);
    users.forEach(user => {
      const hasPayroll = rows.some(r => r.employee_id === user.id);
      const indicator = hasPayroll ? '✅' : '❌';
      console.log(`  ${indicator} ${user.id}: ${user.full_name} (${user.username}) - ${user.role}`);
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPayroll();

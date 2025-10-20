const { getDb } = require('./db-helpers');

async function fixPayrollSchema() {
  console.log('Fixing employee_payroll_info table schema...\n');
  
  const db = await getDb();
  
  try {
    // Check current columns
    const columns = await db.all("PRAGMA table_info(employee_payroll_info)");
    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    const columnNames = columns.map(c => c.name);
    
    // Add missing columns if they don't exist
    if (!columnNames.includes('salary')) {
      console.log('\n✅ Adding salary column...');
      await db.run('ALTER TABLE employee_payroll_info ADD COLUMN salary REAL');
    }
    
    if (!columnNames.includes('pay_period_type')) {
      console.log('✅ Adding pay_period_type column...');
      await db.run('ALTER TABLE employee_payroll_info ADD COLUMN pay_period_type TEXT DEFAULT "biweekly"');
    }
    
    // Update existing data to use new columns if needed
    if (columnNames.includes('annual_salary') && columnNames.includes('salary')) {
      console.log('✅ Copying annual_salary to salary...');
      await db.run('UPDATE employee_payroll_info SET salary = annual_salary WHERE salary IS NULL');
    }
    
    if (columnNames.includes('pay_schedule') && columnNames.includes('pay_period_type')) {
      console.log('✅ Copying pay_schedule to pay_period_type...');
      await db.run('UPDATE employee_payroll_info SET pay_period_type = pay_schedule WHERE pay_period_type IS NULL');
    }
    
    console.log('\n✅ Schema fixed successfully!\n');
    
    // Show final columns
    const finalColumns = await db.all("PRAGMA table_info(employee_payroll_info)");
    console.log('Final columns:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixPayrollSchema();

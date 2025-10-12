const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://pemhmkrhcyygnhkogmry.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

async function setupDatabase() {
  console.log('Setting up database schema...');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250819101351_nameless_sunset.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Remove comments and split into individual statements
  const statements = migrationSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('/*') && !line.trim().startsWith('--') && line.trim() !== '')
    .join('\n')
    .split(';')
    .filter(statement => statement.trim() !== '');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
        if (error) {
          console.error('Error executing statement:', error);
        }
      }
    }
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://hojbeydqphifpipeqbcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY'
);

async function checkColumns() {
  const { data, error } = await supabase.from('inventario').select('*').limit(1);
  if (error) {
    fs.writeFileSync('db_error.log', JSON.stringify(error, null, 2));
    process.exit(1);
  }
  fs.writeFileSync('db_columns.log', JSON.stringify(Object.keys(data[0] || {}), null, 2));
}

checkColumns();

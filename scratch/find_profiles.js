require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findUsersProfile() {
    try {
        const { data, error } = await supabase
            .from('users_profile')
            .select('*');
        
        if (error) {
            console.error('Error fetching users_profile:', error);
            process.exit(1);
        }

        console.log('users_profile in database:', data);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUsersProfile();

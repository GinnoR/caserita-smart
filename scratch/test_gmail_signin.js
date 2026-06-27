require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const email = `carlos.mendoza.84517@gmail.com`;
const password = "Caserita#12342026!";

async function testGmailSignIn() {
    try {
        console.log(`Signing in user: ${email}...`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Sign in error:', error.message);
            process.exit(1);
        }

        console.log('Sign in success! Got token:', data?.session?.access_token ? "YES" : "NO");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testGmailSignIn();

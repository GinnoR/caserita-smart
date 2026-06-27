require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const email = `carlos.mendoza.84517@gmail.com`;
const password = "Caserita#12342026!";

async function testGmailSignUp() {
    try {
        console.log(`Registering temporary user: ${email}...`);
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email,
            password
        });

        if (signUpErr) {
            console.error('Sign up error:', signUpErr.message);
            process.exit(1);
        }

        console.log('Sign up success. User ID:', signUpData?.user?.id);
        console.log('User status:', signUpData?.user?.identities);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testGmailSignUp();

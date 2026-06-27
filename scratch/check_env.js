console.log('ENV VARIABLES:');
for (const key in process.env) {
    if (key.includes('SUPABASE') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PASS') || key.includes('SECRET')) {
        console.log(`${key}: ${process.env[key] ? 'DEFINED' : 'UNDEFINED'} (${process.env[key]?.slice(0, 10)}...)`);
    }
}
process.exit(0);

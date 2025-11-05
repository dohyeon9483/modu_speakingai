import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const supabaseUrl = env.SUPABASE_DB_URL;
const supabaseKey = env.SUPABASE_DB_PUBLIC_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error(
		'SUPABASE_DB_URL and SUPABASE_DB_PUBLIC_KEY must be set in .env file.\n' +
		'Example:\n' +
		'SUPABASE_DB_URL=https://xxxxx.supabase.co\n' +
		'SUPABASE_DB_PUBLIC_KEY=eyJhbGc...'
	);
}

export const supabase = createClient(supabaseUrl, supabaseKey);


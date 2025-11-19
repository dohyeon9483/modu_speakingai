import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const supabase = createClient(env.SUPABASE_DB_URL, env.SUPABASE_DB_PUBLIC_KEY);

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
    try {
        const userId = locals.user?.id;
        if (!userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('users')
            .select('age, gender, personality, occupation, characteristics')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('프로필 조회 오류:', error);
            return json({ error: '프로필 조회 실패' }, { status: 500 });
        }

        return json({ success: true, profile: data });
    } catch (err) {
        console.error('GET /api/user/profile error:', err);
        return json({ error: '서버 오류' }, { status: 500 });
    }
}

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ request, locals }) {
    try {
        const userId = locals.user?.id;
        if (!userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { age, gender, personality, occupation, characteristics } = await request.json();

        const { data, error } = await supabase
            .from('users')
            .update({
                age: age || null,
                gender: gender || null,
                personality: personality || null,
                occupation: occupation || null,
                characteristics: characteristics || null
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('프로필 업데이트 오류:', error);
            return json({ error: '프로필 업데이트 실패' }, { status: 500 });
        }

        return json({ success: true, profile: data });
    } catch (err) {
        console.error('PATCH /api/user/profile error:', err);
        return json({ error: '서버 오류' }, { status: 500 });
    }
}


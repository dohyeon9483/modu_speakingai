import { redirect } from '@sveltejs/kit';
import { supabaseClient } from '$lib/supabaseClient.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
    if (!locals.user) {
        throw redirect(307, '/login');
    }

    const userId = locals.user.id;
    const { data: profile, error } = await supabaseClient
        .from('users')
        .select('id, name, email, created_at')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('마이페이지 사용자 정보 조회 실패:', error);
    }

    return {
        user: {
            ...locals.user,
            email: profile?.email || locals.user.email || null,
            created_at: profile?.created_at || locals.user.created_at || null,
            name: profile?.name || locals.user.name || null
        }
    };
}

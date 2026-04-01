import { sql } from '@vercel/postgres';

export async function saveUser(profile: any) {
  try {
    await sql`
      INSERT INTO users (email, name, image, google_id, last_login)
      VALUES (${profile.email}, ${profile.name}, ${profile.picture}, ${profile.sub}, NOW())
      ON CONFLICT (email) 
      DO UPDATE SET 
        name = ${profile.name},
        image = ${profile.picture},
        last_login = NOW()
    `;
  } catch (error) {
    console.error('保存用户失败:', error);
  }
}

import { getDb, corsHeaders } from './db.js';

export default async function handler(req, res) {
  const headers = corsHeaders();
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const categories = await sql`
        SELECT * FROM categories ORDER BY name
      `;
      return res.status(200).json(categories);
    }

    if (req.method === 'POST') {
      const { name, description } = req.body;
      const result = await sql`
        INSERT INTO categories (name, description)
        VALUES (${name}, ${description})
        RETURNING *
      `;
      return res.status(201).json(result[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

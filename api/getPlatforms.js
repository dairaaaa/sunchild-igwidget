// api/getPlatforms.js
export default async function handler(req, res) {
  const NOTION_TOKEN    = process.env.NOTION_TOKEN;
  const PLATFORMS_DB_ID = process.env.NOTION_DATABASE_PLATEFORMES_ID;

  if (!NOTION_TOKEN || !PLATFORMS_DB_ID) {
    return res.status(500).json({ error: 'Variable NOTION_DATABASE_PLATEFORMES_ID manquante.' });
  }

  try {
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${PLATFORMS_DB_ID}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ page_size: 20 }),
    });

    if (!notionRes.ok) throw new Error(`Notion ${notionRes.status}: ${await notionRes.text()}`);
    const data = await notionRes.json();

    const platforms = data.results.map((page) => {
      const p = page.properties;
      return {
        id:   page.id,
        name: p.Nom?.title?.[0]?.plain_text || p.Name?.title?.[0]?.plain_text || '',
        icon: p.Icône?.rich_text?.[0]?.plain_text || p.Icon?.rich_text?.[0]?.plain_text || '',
      };
    }).filter(p => p.name);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(platforms);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

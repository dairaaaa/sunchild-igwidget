console.log('ENV CHECK:', !!process.env.NOTION_TOKEN, !!process.env.NOTION_DATABASE_CONTENUS_ID);

// api/getPosts.js
module.exports = async function handler(req, res) {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DB_ID = process.env.NOTION_DATABASE_CONTENUS_ID;

  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    return res.status(500).json({ error: 'Variables Notion manquantes.' });
  }

  const platform = req.query?.platform || null;
  const filter = platform
    ? { property: 'Plateforme', select: { equals: platform } }
    : undefined;

  try {
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        ...(filter ? { filter } : {}),
        sorts: [{ property: 'Date de publication', direction: 'ascending' }],
        page_size: 100,
      }),
    });

    if (!notionRes.ok) throw new Error(`Notion ${notionRes.status}: ${await notionRes.text()}`);
    const data = await notionRes.json();

    const posts = data.results.map((page) => {
      const p = page.properties;
      const title    = p['Nom']?.title?.[0]?.plain_text || p['Name']?.title?.[0]?.plain_text || p['Titre']?.title?.[0]?.plain_text || '';
      const status   = p['État']?.status?.name || p['État']?.select?.name || '';
      const date     = p['Date de publication']?.date?.start || null;
      const format   = p['Format']?.select?.name || '';
      const platform = p['Plateforme']?.select?.name || '';
      const pilier   = p['Pilier']?.select?.name || p['Pilier']?.rich_text?.[0]?.plain_text || '';
      const isVideo  = format === 'Vidéo' || format === 'Reels';

      let imageUrl = '';
      const imgProp = p['Images']?.files?.[0];
      if (imgProp) imageUrl = imgProp.type === 'external' ? imgProp.external?.url : imgProp.file?.url || '';
      if (!imageUrl && page.cover) imageUrl = page.cover.type === 'external' ? page.cover.external?.url : page.cover.file?.url || '';

      return { id: page.id, title, status, date, format, platform, pilier, imageUrl, isVideo };
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

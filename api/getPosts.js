module.exports = async function handler(req, res) {
  return res.status(200).json({
    token: process.env.NOTION_TOKEN ? 'OK' : 'MANQUANT',
    db: process.env.NOTION_DATABASE_CONTENUS_ID ? 'OK' : 'MANQUANT'
  });
};

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/xml");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://wellnesshub.africa/</loc>
  </url>
  <url>
    <loc>https://wellnesshub.africa/about</loc>
  </url>
  <url>
    <loc>https://wellnesshub.africa/services</loc>
  </url>
  <url>
    <loc>https://wellnesshub.africa/contact</loc>
  </url>
</urlset>`;

  res.status(200).send(xml);
}
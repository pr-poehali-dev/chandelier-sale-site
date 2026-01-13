import { useEffect, useState } from 'react';
import { api, Product } from '@/lib/api';

const Sitemap = () => {
  const [xmlContent, setXmlContent] = useState<string>('');

  useEffect(() => {
    generateSitemap();
  }, []);

  const generateSitemap = async () => {
    try {
      const products = await api.getProducts();
      const baseUrl = 'https://светит.shop';
      const today = new Date().toISOString().split('T')[0];

      const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/catalog', priority: '0.9', changefreq: 'daily' },
        { loc: '/catalog?type=chandelier', priority: '0.8', changefreq: 'weekly' },
        { loc: '/catalog?type=lamp', priority: '0.8', changefreq: 'weekly' },
        { loc: '/catalog?type=sconce', priority: '0.8', changefreq: 'weekly' },
        { loc: '/about', priority: '0.7', changefreq: 'monthly' },
        { loc: '/delivery', priority: '0.7', changefreq: 'monthly' },
        { loc: '/blog', priority: '0.6', changefreq: 'weekly' },
        { loc: '/contacts', priority: '0.6', changefreq: 'monthly' },
        { loc: '/collaboration', priority: '0.5', changefreq: 'monthly' },
      ];

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      staticPages.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${page.loc}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      });

      products.forEach((product: Product) => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/product/${product.id}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });

      xml += '</urlset>';

      setXmlContent(xml);
    } catch (error) {
      console.error('Ошибка генерации sitemap:', error);
    }
  };

  useEffect(() => {
    if (xmlContent) {
      document.body.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${xmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }
  }, [xmlContent]);

  return null;
};

export default Sitemap;
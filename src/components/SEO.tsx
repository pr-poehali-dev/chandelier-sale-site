import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  canonicalPath?: string;
}

const SEO = ({ 
  title, 
  description, 
  image,
  type = 'website',
  canonicalPath 
}: SEOProps) => {
  const location = useLocation();
  const baseUrl = 'https://светит.shop';
  const defaultTitle = 'Люстры и светильники — купить в интернет-магазине с доставкой по России';
  const defaultDescription = 'Большой выбор люстр, настольных ламп, бра и светильников известных брендов. Гарантия качества, быстрая доставка по России, акции и скидки до 50%.';
  const defaultImage = 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/og-image-1766397458210.png';

  const pageTitle = title || defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageImage = image || defaultImage;
  const canonical = canonicalPath ? `${baseUrl}${canonicalPath}` : `${baseUrl}${location.pathname}`;

  useEffect(() => {
    document.title = pageTitle;

    const metaTags = {
      description: pageDescription,
      'og:title': pageTitle,
      'og:description': pageDescription,
      'og:image': pageImage,
      'og:url': canonical,
      'og:type': type,
      'twitter:title': pageTitle,
      'twitter:description': pageDescription,
      'twitter:image': pageImage,
      'twitter:url': canonical,
    };

    Object.entries(metaTags).forEach(([key, value]) => {
      const property = key.startsWith('og:') ? 'property' : 'name';
      let meta = document.querySelector(`meta[${property}="${key}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(property, key);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', value);
    });

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonical);

  }, [pageTitle, pageDescription, pageImage, canonical, type]);

  return null;
};

export default SEO;
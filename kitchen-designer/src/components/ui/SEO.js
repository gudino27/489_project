import { Helmet } from 'react-helmet-async';

/**
 * SEO Component
 * Provides dynamic meta tags for each page to improve search engine optimization
 * and social media sharing
 */
const SEO = ({
  title,
  description,
  keywords,
  ogImage = 'https://gudinocustom.com/O.png',
  canonical
}) => {
  const fullTitle = `${title} | Gudino Custom Woodworking`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;

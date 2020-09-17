export function sendCustomDimensions (category, country, isPublic, provider) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    country: country,
    category: category,
    license: isPublic ? 'Public Data' : 'Premium Data',
    provider: provider
  });
}

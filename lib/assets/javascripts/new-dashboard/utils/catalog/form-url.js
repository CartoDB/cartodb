export function formURL (dataset) {
  const url = 'https://carto.com/spatial-data-catalog/form/';
  const urlParams = [];

  const params = {
    category: dataset.category_name,
    country: dataset.country_name,
    datastream: dataset.data_source_name,
    provider: dataset.provider_name,
    license: dataset.license_name
  };

  for (let key in params) {
    if (params[key]) {
      urlParams.push(`${key}=${params[key]}`);
    }
  }

  return encodeURI(`${url}?${urlParams.join('&')}`);
}

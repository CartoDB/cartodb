export function setUrlParameters (state) {
  const baseUrl =
    window.location.protocol +
    '//' +
    window.location.host +
    window.location.pathname;

  let urlParams = [];

  const categories = state.filter.categories;
  for (let key in categories) {
    if (categories[key].length) {
      urlParams.push(`${key}=${categories[key].map(item => item.id).join()}`);
    }
  }

  if (state.filter.searchText) {
    urlParams.push(`search=${encodeURIComponent(state.filter.searchText)}`);
  }

  if (state.filter.page) {
    urlParams.push(`page=${state.filter.page + 1}`);
  }

  urlParams = urlParams.join('&');

  const finalUrl = `${baseUrl}${urlParams ? `?${urlParams}` : ''}`;

  window.history.pushState(null, null, finalUrl);
}

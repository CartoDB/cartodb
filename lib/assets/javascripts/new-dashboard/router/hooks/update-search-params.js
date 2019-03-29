import store from 'new-dashboard/store';

export default function updateSearchParams (to, _, next) {
  store.dispatch('search/doSearch', { query: to.params.query, tag: to.params.tag });
  next();
}

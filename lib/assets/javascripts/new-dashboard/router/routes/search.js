// Hooks
import updateSearchParams from 'new-dashboard/router/hooks/update-search-params';

// Lazy Pages
const Search = () => import('new-dashboard/pages/Search');

const routes = [
  {
    path: '/search/:query',
    name: 'search',
    component: Search,
    meta: {
      title: route => `${route.params.query} · Search | CARTO`
    },
    beforeEnter: updateSearchParams
  },
  {
    path: '/search/tag/:tag',
    name: 'tagSearch',
    component: Search,
    meta: {
      title: route => `${route.params.tag} · Search | CARTO`
    },
    beforeEnter: updateSearchParams
  }
];

export default routes;

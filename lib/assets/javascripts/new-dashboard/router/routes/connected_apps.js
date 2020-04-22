// Hooks
import fetchConnectedApps from 'new-dashboard/router/hooks/fetch-connected-apps';

// Lazy Pages
const ConnectedApps = () => import('new-dashboard/pages/Apps/ConnectedApps');

const routes = [
  {
    path: '/connected_apps',
    name: 'connected_apps',
    component: ConnectedApps,
    meta: {
      title: () => 'Connected Apps | CARTO'
    },
    beforeEnter: fetchConnectedApps
  }
];

export default routes;

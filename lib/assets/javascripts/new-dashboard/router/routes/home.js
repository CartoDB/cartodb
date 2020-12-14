// Pages
import Home from 'new-dashboard/pages/Home/Home';

// Modules
import onboarding from './onboarding';
import {getNewDatasetRoutes} from './data.js';

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: () => 'Home | CARTO'
    },
    children: [
      ...onboarding,
      ...getNewDatasetRoutes('home-dataset'),
      ...getNewDatasetRoutes('home-maps', { mode: 'map' })
    ]
  }
];

export default routes;

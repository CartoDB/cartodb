// Pages
import Home from 'new-dashboard/pages/Home/Home';

// Modules
import onboarding from './onboarding';
import { routesToAddDatasets, routesToAddMaps } from './data.js';

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
      ...routesToAddDatasets('home-dataset'),
      ...routesToAddMaps('home-maps')
    ]
  }
];

export default routes;

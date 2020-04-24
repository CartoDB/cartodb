// Pages
import Home from 'new-dashboard/pages/Home/Home';

// Modules
import onboarding from './onboarding';

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: () => 'Home | CARTO'
    },
    children: onboarding
  }
];

export default routes;

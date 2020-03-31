// Lazy Pages
const Solutions = () => import('new-dashboard/pages/Solutions');

const routes = [
  {
    path: '/solutions',
    name: 'solutions',
    component: Solutions,
    meta: {
      title: () => 'Solutions | CARTO'
    }
  }
];

export default routes;

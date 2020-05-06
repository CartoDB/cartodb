// Lazy Pages
const ConnectionsPage = () => import('new-dashboard/pages/Connections/Main.vue');

const routes = [
  {
    path: '/connections',
    name: 'connections',
    component: ConnectionsPage,
    meta: {
      title: () => 'Connections | CARTO'
    }
  }
];

export default routes;

// Lazy Pages
const DBConnectionPage = () => import('new-dashboard/pages/DBConnection.vue');

const routes = [
  {
    path: '/db',
    name: 'database_connection',
    component: DBConnectionPage,
    meta: {
      title: () => 'Direct Database Connections | CARTO'
    }
  }
];

export default routes;

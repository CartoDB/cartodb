// Hooks
import fetchNotifications from 'new-dashboard/router/hooks/fetch-notifications';

// Lazy Pages
const Notifications = () => import('new-dashboard/pages/Notifications');

const routes = [
  {
    path: '/notifications',
    name: 'notifications',
    component: Notifications,
    meta: {
      title: () => 'Notifications | CARTO'
    },
    beforeEnter: fetchNotifications
  }
];

export default routes;

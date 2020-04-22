// Hooks
import { fetchOAuthApps, fetchIfAppNotFound } from 'new-dashboard/router/hooks/fetch-oauth-apps';

// Lazy Pages
const OAuthApps = () => import('new-dashboard/pages/Apps/OAuthApps');
const EditApp = () => import('new-dashboard/components/Apps/EditApp');
const CreateApp = () => import('new-dashboard/components/Apps/CreateApp');
const AppList = () => import('new-dashboard/components/Apps/AppList');

const routes = [
  {
    path: '/oauth_apps',
    component: OAuthApps,
    meta: {
      title: () => 'OAuth Apps | CARTO'
    },
    children: [
      {
        path: '',
        name: 'oauth_apps_list',
        component: AppList,
        meta: {
          title: () => 'OAuth Apps | CARTO'
        },
        beforeEnter: fetchOAuthApps
      },
      {
        path: 'new',
        name: 'oauth_app_new',
        component: CreateApp,
        meta: {
          title: () => 'Create a new OAuth app | CARTO'
        }
      },
      {
        path: 'edit/:id',
        name: 'oauth_app_edit',
        component: EditApp,
        meta: {
          title: () => 'Edit an existing OAuth App | CARTO'
        },
        beforeEnter: fetchIfAppNotFound
      }
    ]
  }
];

export default routes;

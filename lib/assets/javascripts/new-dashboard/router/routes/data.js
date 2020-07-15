// Hooks
import { datasetsBeforeEnter } from 'new-dashboard/router/hooks/check-navigation';
import { doCatalogRoutes } from '@carto/common-ui';

// Lazy Pages
const Data = () => import('new-dashboard/pages/Data/Data');
const Datasets = () => import('new-dashboard/pages/Data/Datasets');
// const Subscriptions = () => import('new-dashboard/pages/Data/Subscriptions');
const SpatialDataCatalog = () => import('new-dashboard/pages/Data/SpatialDataCatalog');

const routes = [
  {
    path: '/datasets/:filter?',
    component: Data,
    meta: {
      title: () => 'Data | CARTO'
    },
    children: [
      // {
      //   path: 'subscriptions',
      //   name: 'subscriptions',
      //   component: Subscriptions,
      //   meta: {
      //     title: () => 'Subscriptions | CARTO'
      //   }
      // },
      {
        path: 'spatial-data-catalog',
        component: SpatialDataCatalog,
        meta: {
          title: () => 'Spatial Data Catalog | CARTO'
        },
        children: [...doCatalogRoutes]
      },
      {
        path: '',
        component: Datasets,
        name: 'datasets',
        props: (route) => ({ datasetId: route.query.id, createVis: /^true$/i.test(route.query.create) }),
        meta: {
          title: () => 'Data | CARTO'
        },
        beforeEnter: datasetsBeforeEnter
      }
    ]
  }
];

export default routes;

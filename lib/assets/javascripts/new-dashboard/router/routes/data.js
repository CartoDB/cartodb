// Hooks
import { datasetsBeforeEnter, catalogDetailBeforeEnter } from 'new-dashboard/router/hooks/check-navigation';
import { doCatalogRoutes } from '@carto/common-ui';

// Lazy Pages
const Data = () => import('new-dashboard/pages/Data/Data');
const Datasets = () => import('new-dashboard/pages/Data/Datasets');
const Subscriptions = () => import('new-dashboard/pages/Data/Subscriptions');
const Catalog = () => import('new-dashboard/pages/Data/Catalog');
const CatalogDetail = () => import('new-dashboard/pages/Data/CatalogDetail');
const DOCatalog = () => import('new-dashboard/pages/Data/DOCatalog');

const routes = [
  {
    path: '/datasets/:filter?',
    component: Data,
    meta: {
      title: () => 'Data | CARTO'
    },
    children: [
      {
        path: 'catalog',
        name: 'catalog',
        component: Catalog,
        meta: {
          title: () => 'Catalog | CARTO'
        }
      },
      {
        path: 'do-catalog',
        component: DOCatalog,
        meta: {
          title: () => 'Data Observatory Catalog | CARTO'
        },
        children: [ ...doCatalogRoutes ]
      },
      {
        path: 'subscriptions',
        name: 'subscriptions',
        component: Subscriptions,
        meta: {
          title: () => 'Subscriptions | CARTO'
        }
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
  },
  {
    path: '/datasets/catalog/:id',
    name: 'catalog_detail',
    component: CatalogDetail,
    meta: {
      title: () => 'Detail Dataset Catalog | CARTO'
    },
    beforeEnter: catalogDetailBeforeEnter
  }
];

export default routes;

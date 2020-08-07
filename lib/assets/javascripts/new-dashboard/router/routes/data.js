// Hooks
import { datasetsBeforeEnter } from 'new-dashboard/router/hooks/check-navigation';

// Lazy Pages
const Data = () => import('new-dashboard/pages/Data/Data');
const Datasets = () => import('new-dashboard/pages/Data/Datasets');
const Subscriptions = () => import('new-dashboard/pages/Data/Subscriptions');
const Catalog = () => import('new-dashboard/pages/Data/Catalog');
const CatalogDataset = () => import('new-dashboard/pages/Data/CatalogDataset');
const CatalogDatasetData = () => import('new-dashboard/pages/Data/CatalogDatasetData');
const CatalogDatasetSummary = () => import('new-dashboard/pages/Data/CatalogDatasetSummary');

const routes = [
  {
    path: '/datasets/:filter?',
    component: Data,
    meta: {
      title: () => 'Data | CARTO'
    },
    children: [
      {
        path: 'subscriptions',
        name: 'subscriptions',
        component: Subscriptions,
        meta: {
          title: () => 'Subscriptions | CARTO'
        }
      },
      {
        path: 'spatial-data-catalog',
        name: 'spatial-data-catalog',
        component: Catalog,
        meta: {
          title: () => 'Spatial Data Catalog | CARTO'
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
    path: '/datasets/spatial-data-catalog/:type/:datasetId',
    component: CatalogDataset,
    meta: {
      title: () => 'Spatial Data Catalog | CARTO'
    },
    children: [
      {
        path: 'data',
        name: 'catalog-dataset-data',
        component: CatalogDatasetData,
        meta: {
          title: () => 'Spatial Data Catalog | CARTO'
        }
      },
      {
        path: '',
        name: 'catalog-dataset-summary',
        component: CatalogDatasetSummary,
        meta: {
          title: () => 'Spatial Data Catalog | CARTO'
        }
      }
    ]
  }
];

export default routes;

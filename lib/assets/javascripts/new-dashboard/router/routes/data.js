// Hooks
import { datasetsBeforeEnter } from 'new-dashboard/router/hooks/check-navigation';

// Lazy Pages
const Data = () => import('new-dashboard/pages/Data/Data');
const Datasets = () => import('new-dashboard/pages/Data/Datasets');
const Subscriptions = () => import('new-dashboard/pages/Data/Subscriptions');
const SpatialDataCatalog = () => import('new-dashboard/pages/Data/SpatialDataCatalog');
const DatasetDetail = () => import('new-dashboard/pages/Data/Catalog/DatasetDetail');
const DatasetData = () => import('new-dashboard/pages/Data/Catalog/DatasetData');
const DatasetSummary = () => import('new-dashboard/pages/Data/Catalog/DatasetSummary');
const CatalogSearch = () => import('new-dashboard/pages/Data/Catalog/CatalogSearch');

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
        component: SpatialDataCatalog,
        meta: {
          title: () => 'Spatial Data Catalog | CARTO'
        },
        children: [
          {
            path: ':type/:datasetId',
            component: DatasetDetail,
            meta: {
              title: () => 'Spatial Data Catalog | CARTO'
            },
            children: [
              {
                path: 'data',
                name: 'do-dataset-data',
                component: DatasetData,
                meta: {
                  title: () => 'Spatial Data Catalog | CARTO'
                }
              },
              {
                path: '',
                name: 'do-dataset-summary',
                component: DatasetSummary,
                meta: {
                  title: () => 'Spatial Data Catalog | CARTO'
                }
              }
            ]
          },
          {
            path: '',
            name: 'do-catalog',
            component: CatalogSearch,
            meta: {
              title: () => 'Spatial Data Catalog | CARTO'
            }
          }
        ]
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

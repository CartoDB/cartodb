// Lazy Pages
const Data = () => import('new-dashboard/pages/Data/Data');
const Datasets = () => import('new-dashboard/pages/Data/Datasets');
const Catalog = () => import('new-dashboard/pages/Data/Catalog');
const CatalogDetail = () => import('new-dashboard/pages/Data/CatalogDetail');

// Hooks
import { datasetsBeforeEnter, catalogDetailBeforeEnter } from 'new-dashboard/router/hooks/check-navigation';

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
        path: '',
        component: Datasets,
        name: 'datasets',
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
  },
];

export default routes;

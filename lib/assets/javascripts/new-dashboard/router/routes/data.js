// Hooks
import { addLocale } from 'core-js';
import { datasetsBeforeEnter } from 'new-dashboard/router/hooks/check-navigation';
import store from '../../store';

// Lazy Pages
const Data = () => import('new-dashboard/pages/Data/Data');
const Datasets = () => import('new-dashboard/pages/Data/Datasets');
const Subscriptions = () => import('new-dashboard/pages/Data/Subscriptions');
const Catalog = () => import('new-dashboard/pages/Data/Catalog');
const CatalogDataset = () => import('new-dashboard/pages/Data/CatalogDataset');
const CatalogDatasetData = () => import('new-dashboard/pages/Data/CatalogDatasetData');
const CatalogDatasetSummary = () => import('new-dashboard/pages/Data/CatalogDatasetSummary');
const ConnectionsPage = () => import('new-dashboard/pages/Data/Connections/Connections');
const NewConnectionPage = () => import('new-dashboard/pages/Data/Connections/NewConnection');
const EditConnectionPage = () => import('new-dashboard/pages/Data/Connections/EditConnection');
const DeleteConnectionPage = () => import('new-dashboard/pages/Data/Connections/DeleteConnection');
const DatasetsConnectionPage = () => import('new-dashboard/pages/Data/Connections/DatasetsConnection');
const NewDatasetPage = () => import('new-dashboard/pages/Data/NewDataset');
const AddLocalFile = () => import('new-dashboard/pages/Data/AddLocalFile');

const routes = [
  {
    path: '/datasets/:filter?',
    component: Data,
    meta: {
      title: () => 'Data | CARTO'
    },
    children: [
      {
        path: 'connections',
        name: 'your-connections',
        component: ConnectionsPage,
        meta: {
          title: () => 'Your Connections | CARTO'
        },
        children: [
          {
            path: 'new-connection',
            name: 'new-connection',
            component: NewConnectionPage,
            meta: {
              title: () => 'Your connections | CARTO'
            }
          },
          {
            path: 'edit/:id',
            component: EditConnectionPage,
            name: 'edit-connection',
            meta: {
              title: () => 'Your connections | CARTO'
            }
          },
          {
            path: 'delete/:id',
            component: DeleteConnectionPage,
            name: 'delete-connection',
            meta: {
              title: () => 'Your connections | CARTO'
            }
          },
          ...getCommonConnectionsRoutes('new-connection')
        ]
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
        beforeEnter: datasetsBeforeEnter,
        children: [
          ...getNewDatasetRoutes('datasets')
        ]
      }
    ]
  },
  {
    path: '/datasets/spatial-data-catalog/:entity_type/:entity_id',
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

if (store.state.user.do_enabled) {
  routes[0].children.unshift({
    path: 'subscriptions',
    name: 'subscriptions',
    component: Subscriptions,
    meta: {
      title: () => 'Subscriptions | CARTO'
    }
  });
}

function getCommonConnectionsRoutes (rootNamedRoute) {
  const namePrefix = `${rootNamedRoute}-`;
  return [
    {
      path: `connection/:id/dataset`,
      name: `${namePrefix}connection-dataset`,
      component: DatasetsConnectionPage,
      props: { backNamedRoute: rootNamedRoute },
      meta: {
        title: () => 'Your connections | CARTO'
      }
    },
    {
      path: `new-connection/:connector`,
      component: EditConnectionPage,
      props: { backNamedRoute: rootNamedRoute },
      name: `${namePrefix}connector-selected`,
      meta: {
        title: () => 'Your connections | CARTO'
      }
    }
  ];
}

export function getNewDatasetRoutes (rootNamedRoute) {
  // const namePrefix = rootNamedRoute !== 'new-dataset' ? `${rootNamedRoute}-` : '';
  const namePrefix = `${rootNamedRoute}-`;
  const newDatesetName = `${namePrefix}new-dataset`;
  return [
    {
      path: 'new-dataset',
      name: newDatesetName,
      component: NewDatasetPage,
      meta: {
        title: () => 'Data | CARTO'
      }
    },
    // ...getCommonConnectionsRoutes(rootNamedRoute),
    ...getCommonConnectionsRoutes(newDatesetName),
    {
      path: 'add-local-file/:extension',
      name: `${namePrefix}add-local-file`,
      component: AddLocalFile,
      meta: {
        title: () => 'Data | CARTO'
      }
    }
  ];
}

export default routes;

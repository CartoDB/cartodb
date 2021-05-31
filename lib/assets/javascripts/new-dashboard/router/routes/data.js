// Hooks
import { datasetsBeforeEnter } from 'new-dashboard/router/hooks/check-navigation';
import store from '../../store';

// Lazy Pages
const Data = () => import('new-dashboard/pages/Data/Data');
const Datasets = () => import('new-dashboard/pages/Data/Datasets');
const Subscriptions = () => import('new-dashboard/pages/Data/Subscriptions');
const Tilesets = () => import('new-dashboard/pages/Data/Tilesets/Tilesets');
const TilesetsViewerPage = () => import('new-dashboard/pages/TilesetsViewer');
const Catalog = () => import('new-dashboard/pages/Data/Catalog');
const CatalogDataset = () => import('new-dashboard/pages/Data/CatalogDataset');
const CatalogDatasetMap = () => import('new-dashboard/pages/Data/CatalogDatasetMap');
const CatalogDatasetData = () => import('new-dashboard/pages/Data/CatalogDatasetData');
const CatalogDatasetSummary = () => import('new-dashboard/pages/Data/CatalogDatasetSummary');
const ConnectionsPage = () => import('new-dashboard/pages/Data/Connections/Connections');
const NewConnectionPage = () => import('new-dashboard/pages/Data/Connections/NewConnection');
const EditConnectionPage = () => import('new-dashboard/pages/Data/Connections/EditConnection');
const DeleteConnectionPage = () => import('new-dashboard/pages/Data/Connections/DeleteConnection');
const DatasetsConnectionPage = () => import('new-dashboard/pages/Data/Connections/DatasetsConnection');
const NewDatasetPage = () => import('new-dashboard/pages/Data/NewDataset');
const AddLocalFile = () => import('new-dashboard/pages/Data/AddLocalFile');
const ArcgisConnector = () => import('new-dashboard/pages/Data/ArcgisConnector');
const TwitterConnector = () => import('new-dashboard/pages/Data/TwitterConnector');

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
        path: 'tilesets',
        name: 'tilesets',
        component: Tilesets,
        meta: {
          title: () => 'Your tilesets | CARTO'
        },
        children: [
          {
            path: '/tilesets/:id',
            name: 'tileset-viewer',
            component: TilesetsViewerPage,
            meta: {
              title: () => 'Tilesets viewer | CARTO'
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
        beforeEnter: datasetsBeforeEnter,
        children: [
          ...routesToAddDatasets('datasets')
        ]
      }
    ]
  }
];

// If is not on-premise then create paths for spatial-data-catalog
if (!store.state.config.cartodb_com_hosted) {
  routes[0].children.unshift({
    path: 'spatial-data-catalog',
    name: 'spatial-data-catalog',
    component: Catalog,
    meta: {
      title: () => 'Spatial Data Catalog | CARTO'
    }
  });

  routes.push({
    path: '/datasets/spatial-data-catalog/:entity_type/:entity_id',
    component: CatalogDataset,
    meta: {
      title: () => 'Spatial Data Catalog | CARTO'
    },
    children: [
      {
        path: 'map',
        name: 'catalog-dataset-map',
        component: CatalogDatasetMap,
        meta: {
          title: () => 'Spatial Data Catalog | CARTO'
        }
      },
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
  });
}

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

function getCommonConnectionsRoutes (rootNamedRoute, props = { mode: 'dataset' }) {
  const namePrefix = `${rootNamedRoute}-`;
  const pathPrefix = props.mode ? `${props.mode}-` : '';

  return [
    {
      path: `${pathPrefix}connection/:id/dataset`,
      name: `${namePrefix}connection-dataset`,
      component: DatasetsConnectionPage,
      props: { backNamedRoute: rootNamedRoute, ...props },
      meta: {
        title: () => 'Your connections | CARTO'
      }
    },
    {
      path: `${pathPrefix}new-connection/:connector`,
      component: EditConnectionPage,
      props: { backNamedRoute: rootNamedRoute, ...props },
      name: `${namePrefix}connector-selected`,
      meta: {
        title: () => 'Your connections | CARTO'
      }
    }
  ];
}

// Mode can be dataset, map or layer
function getNewDatasetRoutes (rootNamedRoute, props = { mode: 'dataset' }) {
  const namePrefix = `${rootNamedRoute}-`;
  const newDatesetName = `${namePrefix}new-dataset`;
  return [
    {
      path: `new-${props.mode}`,
      name: newDatesetName,
      component: NewDatasetPage,
      meta: {
        title: () => 'Data | CARTO'
      },
      props: props
    },
    ...getCommonConnectionsRoutes(newDatesetName, props),
    {
      path: `${props.mode}-add-local-file/:extension`,
      name: `${namePrefix}add-local-file`,
      component: AddLocalFile,
      meta: {
        title: () => 'Data | CARTO'
      },
      props: props
    },
    {
      path: `${props.mode}-import-arcgis`,
      name: `${namePrefix}import-arcgis`,
      component: ArcgisConnector,
      meta: {
        title: () => 'Data | CARTO'
      },
      props: props
    },
    {
      path: `${props.mode}-import-twitter`,
      name: `${namePrefix}import-twitter`,
      component: TwitterConnector,
      meta: {
        title: () => 'Data | CARTO'
      },
      props: props
    }
  ];
}

export function routesToAddDatasets (rootNamedRoute) {
  return getNewDatasetRoutes(rootNamedRoute, { mode: 'dataset' });
}

export function routesToAddMaps (rootNamedRoute) {
  return getNewDatasetRoutes(rootNamedRoute, { mode: 'map' });
}

export function routesToAddLayers (rootNamedRoute) {
  return getNewDatasetRoutes(rootNamedRoute, { mode: 'layer' });
}

export default routes;

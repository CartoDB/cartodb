import Vue from 'vue';
import Router from 'vue-router';

import Catalog from 'new-dashboard/pages/Data/Catalog.vue';
import CatalogDataset from 'new-dashboard/pages/Data/CatalogDataset.vue';
import CatalogDatasetMap from 'new-dashboard/pages/Data/CatalogDatasetMap.vue';
import CatalogDatasetData from 'new-dashboard/pages/Data/CatalogDatasetData.vue';
import CatalogDatasetSummary from 'new-dashboard/pages/Data/CatalogDatasetSummary.vue';

const isCartoWorkspace = window.CARTO_WORKSPACE;

Vue.use(Router);
const router = new Router({
  mode: 'history',
  base: '/spatial-data-catalog/browser/',
  routes: [
    {
      path: '/',
      name: 'spatial-data-catalog',
      component: Catalog,
      props: { publicWebsite: true, isCartoWorkspace },
      meta: {
        title: () => 'Spatial Data Catalog | CARTO'
      }
    },
    {
      path: '/do-catalog/internal',
      redirect: { name: 'spatial-data-catalog' }
    },
    {
      path: '/:entity_type/:entity_id',
      component: CatalogDataset,
      props: { publicWebsite: true, isCartoWorkspace },
      meta: {
        title: () => 'Spatial Data Catalog | CARTO'
      },
      children: [
        {
          path: 'map',
          name: 'catalog-dataset-map',
          component: CatalogDatasetMap,
          meta: {
            title: (datasetName) => `${datasetName} - Map | CARTO`,
            titleInComponent: true
          }
        },
        {
          path: 'data',
          name: 'catalog-dataset-data',
          component: CatalogDatasetData,
          meta: {
            title: (datasetName) => `${datasetName} - Data | CARTO`,
            titleInComponent: true
          }
        },
        {
          path: '',
          name: 'catalog-dataset-summary',
          component: CatalogDatasetSummary,
          meta: {
            title: (datasetName) => `${datasetName} - Summary | CARTO`,
            titleInComponent: true
          }
        }
      ]
    }
  ]
});

router.beforeEach((to, _, next) => {
  if (!to.matched || !to.matched.length) {
    next({ path: '' });
  }

  next();
});

function addCanonical (canonicalUrl) {
  const canonicalLink = document.head.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.setAttribute('href', canonicalUrl);
  } else {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    document.head.appendChild(link);
  }
}

router.afterEach(to => {
  window.scrollTo({ top: 0, left: 0 });

  Vue.nextTick(() => {
    if (!to.meta.titleInComponent) {
      document.title = to.meta.title(to);
    }
    addCanonical(`https://carto.com/spatial-data-catalog/browser${to.path}`);
  });
});

export default router;

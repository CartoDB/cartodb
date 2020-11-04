import Vue from 'vue';
import Router from 'vue-router';

import Catalog from 'new-dashboard/pages/Data/Catalog.vue';
import CatalogDataset from 'new-dashboard/pages/Data/CatalogDataset.vue';
import CatalogDatasetData from 'new-dashboard/pages/Data/CatalogDatasetData.vue';
import CatalogDatasetSummary from 'new-dashboard/pages/Data/CatalogDatasetSummary.vue';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: '/spatial-data-catalog/browser/',
  routes: [
    {
      path: '/',
      name: 'spatial-data-catalog',
      component: Catalog,
      props: { publicWebsite: true },
      meta: {
        title: () => 'Spatial Data Catalog | CARTO'
      }
    },
    {
      path: '/:type/:datasetId',
      component: CatalogDataset,
      props: { publicWebsite: true },
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
  ]
});

router.beforeEach((to, _, next) => {
  if (!to.matched || !to.matched.length) {
    next({ path: '' });
  }

  next();
});

router.afterEach(to => {
  window.scrollTo({ top: 0, left: 0 });

  Vue.nextTick(() => {
    document.title = to.meta.title(to);
  });
});

export default router;

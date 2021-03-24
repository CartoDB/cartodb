import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: '/spatial-data-catalog/browser/',
  routes: []
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
    addCanonical(`https://carto.com/spatial-data-catalog/browser${to.fullPath}`);
  });
});

export default router;

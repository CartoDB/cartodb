import 'babel-polyfill';
import Vue from 'vue';
import App from './App.vue';

import i18n from './i18n';
import store from './store';
import router from './router';

Vue.config.productionTip = false;

/* eslint-disable no-new */
function execDataObservatoryCatalog (el) {
  if (document.querySelector(el)) {
    const app = new Vue({
      el,
      router,
      store,
      i18n,
      components: { App },
      template: '<App />'
    });

    return { app, router };
  }
}

const el = process.env.NODE_ENV === 'development' ? '#app' : '#do-catalog';
execDataObservatoryCatalog(el);

window.createDataObservatoryCatalog = execDataObservatoryCatalog;

// HTML integration
/*
  <script src="./javascripts/do-catalog.umd.min.js" async defer></script>
  <div id="do-catalog"></div>
*/

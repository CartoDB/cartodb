import 'babel-polyfill';
import Vue from 'vue';
import App from './App.vue';

import i18n from './i18n';
import store from './store';
import router from './router';

Vue.config.productionTip = false;

const el = process.env.NODE_ENV === 'development' ? '#app' : '#do-catalog';

/* eslint-disable no-new */
function execDataObservatoryCatalog () {
  new Vue({
    el,
    router,
    store,
    i18n,
    components: { App },
    template: '<App />'
  });
}

execDataObservatoryCatalog();

window.createDataObservatoryCatalog = execDataObservatoryCatalog;

// HTML integration
/*
  <script src="./javascripts/do-catalog.umd.min.js" async defer></script>
  <div id="do-catalog"></div>
*/

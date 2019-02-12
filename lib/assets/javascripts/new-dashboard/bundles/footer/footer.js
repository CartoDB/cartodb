import Vue from 'vue';
import i18n from 'new-dashboard/i18n';

import Footer from 'new-dashboard/components/Footer';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

Vue.config.productionTip = false;

const CARTOData = getCARTOData();
const user = CARTOData.user_data;

/* eslint-disable no-new */
new Vue({
  el: '.js-footer',
  i18n,
  components: { Footer },
  data () {
    return { user };
  },
  template: '<Footer :user="user"/>'
});

import Vue from 'vue';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

const CARTOData = getCARTOData();

Vue.component(
  'router-link',
  {
    template: '<a :href="url"><slot/></a>',
    props: {
      staticRoute: String
    },
    computed: {
      url: function () {
        const baseUrl = CARTOData.user_data.base_url;
        return baseUrl + this.staticRoute;
      }
    }
  }
);

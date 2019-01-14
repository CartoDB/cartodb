import Vue from 'vue';

Vue.component(
  'router-link',
  {
    template: '<a :href="url"><slot/></a>',
    props: {
      staticRoute: String
    },
    computed: {
      url: function () {
        const baseUrl = window.CartoConfig.data.user_data.base_url;
        return baseUrl + this.staticRoute;
      }
    }
  }
);

import Vue from 'vue';

Vue.config.productionTip = false;

// Make jQuery global without DefinePlugin
window.jQuery = require('jquery');

window.CartoConfig = {
  data: {
    user_data: {
      email: 'example@example.org',
      username: 'example',
      website: 'https://carto.com',
      api_key: 'default_public'
    },
    config: {
      sql_api_template: 'https://{user}.carto.com'
    }
  }
};

window._t = (key) => key;

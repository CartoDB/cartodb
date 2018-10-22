import Vue from 'vue';

Vue.config.productionTip = false;

// Make jQuery global without DefinePlugin
window.jQuery = require('jquery');

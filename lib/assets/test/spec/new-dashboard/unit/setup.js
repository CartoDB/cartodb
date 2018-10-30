import Vue from 'vue';

Vue.config.productionTip = false;

// Make jQuery global without DefinePlugin
window.jQuery = require('jquery');

var Polyglot = require('node-polyglot');

var polyglot = new Polyglot({
  locale: 'en', // Needed for pluralize behaviour
  phrases: {}
});

window._t = polyglot.t.bind(polyglot);

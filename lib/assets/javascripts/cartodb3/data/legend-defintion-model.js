var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');

module.exports = Backbone.Model.extend({
  defaults: {
    type: 'none',
    title: '',
    title_visible: false,
    items: [],
    prefix: '',
    suffix: '',
    rawHtml: '',
    preHtml: '',
    postHtml: '',
    fill: '#fabada'
  },

  sync: syncAbort
});

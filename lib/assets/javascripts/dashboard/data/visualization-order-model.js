const Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  url: function (method) {
    return this.visualization.url(method) + '/next_id';
  },

  initialize: function () {
    this.visualization = this.get('visualization');
    this.set('id', this.visualization.id);
    this.unset('visualization');
  }
});

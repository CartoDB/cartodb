var CoreView = require('backbone/core-view');
var template = require('./basemap-header.tpl');

var DEFAULT_NAME = _t('editor.layers.basemap.custom-basemap');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.category) throw new Error('category is required');

    this.category = opts.category;
  },

  render: function () {
    this.$el.html(
      template({
        title: _t('editor.layers.basemap.title-label'),
        description: this._getName()
      })
    );
    return this;
  },

  _getName: function () {
    var name = this.model.getName();

    if (!name) {
      name = DEFAULT_NAME;
    } else {
      name = this.model.getName().replace(/_/g, '') + ' ' + _t('editor.layers.basemap.by') + ' ' + this.category;
    }

    return name;
  }

});

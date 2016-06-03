var cdb = require('cartodb.js');
var template = require('./basemap-header.tpl');

module.exports = cdb.core.View.extend({

  render: function () {
    this.$el.html(
      template({
        title: _t('editor.layers.basemap.title-label'),
        description: this.model.getName() + ' by CartoDB'
      })
    );
    return this;
  }

});

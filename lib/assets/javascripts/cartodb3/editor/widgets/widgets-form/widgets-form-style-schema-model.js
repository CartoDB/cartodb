var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  initialize: function () {
    var o = [
      {
        val: true,
        label: _t('editor.widgets.style.yes')
      }, {
        val: false,
        label: _t('editor.widgets.style.no')
      }
    ];
    this.schema = {
      sync_on_data_change: {
        type: 'Radio',
        title: _t('editor.widgets.style.sync_on_data_change'),
        options: o
      },
      sync_on_bbox_change: {
        type: 'Radio',
        title: _t('editor.widgets.style.sync_on_bbox_change'),
        options: o
      },
      description: {
        type: 'TextArea',
        title: _t('editor.widgets.style.description')
      }
    };
  }

});

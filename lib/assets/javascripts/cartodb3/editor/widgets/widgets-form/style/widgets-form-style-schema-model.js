var _ = require('underscore');
var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function () {
    var o = [
      {
        val: true,
        label: _t('editor.widgets.widgets-form.style.yes')
      }, {
        val: false,
        label: _t('editor.widgets.widgets-form.style.no')
      }
    ];
    this.schema = {
      sync_on_data_change: {
        type: 'Radio',
        title: _t('editor.widgets.widgets-form.style.sync_on_data_change'),
        options: o
      },
      sync_on_bbox_change: {
        type: 'Radio',
        title: _t('editor.widgets.widgets-form.style.sync_on_bbox_change'),
        options: o
      }
    };
  },

  parse: function (r) {
    var attrs = _.defaults(
      {
        sync_on_bbox_change: r.sync_on_bbox_change ? 'true' : '',
        sync_on_data_change: r.sync_on_data_change ? 'true' : ''
      },
      r
    );
    return attrs;
  },

  updateWidgetDefinitionModel: function (widgetDefinitionModel) {
    var attrs = _.defaults(
      {
        sync_on_bbox_change: this.get('sync_on_bbox_change') === 'true',
        sync_on_data_change: this.get('sync_on_data_change') === 'true'
      },
      this.attributes
    );
    widgetDefinitionModel.save(attrs);
  }

});

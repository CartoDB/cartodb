var _ = require('underscore');
var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

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
        sync_on_bbox_change: r.sync_on_bbox_change ? 'true' : ''
      },
      r
    );
    return attrs;
  },

  changeWidgetDefinitionModel: function (widgetDefinitionModel) {
    var attrs = _.defaults(
      {
        sync_on_bbox_change: this.get('sync_on_bbox_change') === 'true'
      },
      this.attributes
    );

    widgetDefinitionModel.set(attrs);
  }

});

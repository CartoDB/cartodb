var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    this._layerTableModel = opts.layerTableModel;
  },

  parse: function (r) {
    // Translate start+end unix timestamps to expected date objects for the form
    return _.defaults({
      start: new Date(r.start * 1000),
      end: new Date(r.end * 1000)
    }, r);
  },

  updateSchema: function () {
    var columns = this._columnsForSelectedLayer();

    this.schema = {
      title: {
        title: _t('editor.widgets.data.title'),
        type: 'Text',
        validators: ['required']
      },
      column: {
        title: _t('editor.widgets.data.column'),
        type: 'Select',
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
      },
      bins: {
        title: _t('editor.widgets.data.bins'),
        type: 'Number'
      },
      start: {
        title: _t('editor.widgets.data.start'),
        type: 'Date'
      },
      end: {
        title: _t('editor.widgets.data.end'),
        type: 'Date'
      }
    };
  },

  canSave: function () {
    return this.get('column');
  },

  customUpdateWidgetDefinitionModel: function (widgetDefinitionModel) {
    var attrs = _.clone(this.attributes);

    // Transform start+end dates back to expected unix timestamps
    attrs.start = attrs.start.getTime() / 1000;
    attrs.end = attrs.end.getTime() / 1000;

    widgetDefinitionModel.set(attrs);
  },

  _columnsForSelectedLayer: function () {
    if (this._layerTableModel.get('fetched')) {
      return this._layerTableModel
        .columnsCollection
        .filter(this._isDateType)
        .map(function (m) {
          var columnName = m.get('name');
          return {
            val: m.id,
            label: columnName
          };
        });
    } else {
      return [{
        label: _t('editor.widgets.data.loading'),
        disabled: true
      }];
    }
  },

  _isDateType: function (m) {
    return m.get('type') === 'date';
  }

});

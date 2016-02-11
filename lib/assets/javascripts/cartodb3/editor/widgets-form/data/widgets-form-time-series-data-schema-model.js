var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._tableModel = opts.tableModel;

    this._setAttributes();
  },

  updateSchema: function () {
    var columns = this._columnsForSelectedLayer();
    this.schema = {
      title: {
        type: 'Text',
        validators: ['required']
      },
      column: {
        type: 'Select',
        label: _t('editor.widgets.data.value'),
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
      },
      bins: {
        label: _t('editor.widgets.data.buckets'),
        type: 'Number'
      },
      start: {
        type: 'Date'
      },
      end: {
        type: 'Date'
      }
    };
  },

  updateDefinitionModel: function () {
    var column = this.get('column');

    // Columns might not be available until table is fetched
    if (column) {
      this._widgetDefinitionModel.update({
        layer_id: this.get('layer_id'),
        title: this.get('title'),
        options: {
          column: column,
          bins: this.get('bins'),
          start: this.get('start'),
          end: this.get('end')
        }
      });
    }
  },

  _setAttributes: function () {
    var m = this._widgetDefinitionModel;
    var o = m.get('options');
    this.set({
      layer_id: m.get('layer_id'),
      title: m.get('title'),
      column: o.column,
      bins: o.bins,
      start: o.start,
      end: o.end
    });
  },

  _columnsForSelectedLayer: function () {
    if (this._tableModel.get('fetched')) {
      return this._tableModel
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

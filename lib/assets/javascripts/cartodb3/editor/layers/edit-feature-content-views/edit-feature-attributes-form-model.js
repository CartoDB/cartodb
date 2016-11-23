var Backbone = require('backbone');
var _ = require('underscore');
var ColumnRowData = require('../../../data/column-row-data');

var FIELDTYPE_TO_FORMTYPE = {
  string: 'Text',
  boolean: 'Radio',
  number: 'Number',
  date: 'DateTime',
  geometry: 'Text'
};

var BLACKLISTED_COLUMNS = ['created_at', 'the_geom', 'the_geom_webmercator', 'updated_at'];

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.nodeDefModel) throw new Error('nodeDefModel is required');

    this._featureModel = opts.featureModel;
    this._columnsCollection = opts.columnsCollection;
    this._configModel = opts.configModel;
    this._nodeDefModel = opts.nodeDefModel;

    this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', this._onChange, this);
  },

  _onChange: function () {
    _.each(this.changed, function (val, key) {
      this._featureModel.set(key, val);
    }, this);
  },

  _getInputType: function (rows) {
    var inputType = 'Text';

    if (rows && rows.length) {
      if (rows.length === 1 && rows[0] !== null || rows.length > 1) {
        inputType = 'Suggest';
      }
    }

    return inputType;
  },

  _generateSchema: function () {
    var self = this;

    this.schema = {};

    this._columnsCollection.each(function (mdl) {
      var columnName = mdl.get('name');
      var columnType = mdl.get('type');

      if (!_.contains(BLACKLISTED_COLUMNS, columnName)) {
        // default field type
        this.schema[columnName] = {
          type: FIELDTYPE_TO_FORMTYPE[columnType]
        };

        if (columnType === 'string') {
          var columnRowData = new ColumnRowData({
            column: columnName
          }, {
            nodeDefModel: this._nodeDefModel,
            configModel: this._configModel
          });
          columnRowData.bind('columnsFetched', function (rows) {
            if (self.schema[columnName].type !== self._getInputType(rows)) {
              self.schema[columnName].type = self._getInputType(rows);
              self.schema[columnName].editorAttrs = {
                showSearch: true,
                allowFreeTextInput: true,
                collectionData: rows
              };

              self.trigger('changeSchema');
            }
          });
          columnRowData.fetch();
        }

        if (columnType === 'number') {
          this.schema[columnName].isFormatted = true;
          this.schema[columnName].showSlider = false;
        }

        if (columnType === 'boolean') {
          this.schema[columnName].options = [
            {
              label: 'True', // TODO: translate
              val: true
            }, {
              label: 'False',
              val: false
            }, {
              label: 'Null',
              val: null
            }
          ];
        }

        if (columnName === 'cartodb_id') {
          this.schema[columnName].isFormatted = false;
          this.schema[columnName].editorAttrs = {
            disabled: true
          };
        }
      }
    }, this);
  }

});

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

  _getInputType: function (columnRowData) {
    var rows = columnRowData.getRows();
    return rows && rows.length ? 'Suggest' : 'Text';
  },

  _getSupportedColumnType: function (columnType) {
    var supportedColumnType = _.find(_.keys(FIELDTYPE_TO_FORMTYPE), function (fieldType) {
      return fieldType === columnType;
    });

    return supportedColumnType || 'string';
  },

  _generateSchema: function () {
    var self = this;

    this.schema = {};

    this._columnsCollection.each(function (mdl) {
      var columnName = mdl.get('name');
      var columnType = this._getSupportedColumnType(mdl.get('type'));

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
            if (self.schema[columnName].type !== self._getInputType(this)) {
              self.schema[columnName].type = self._getInputType(this);
              self.schema[columnName].editorAttrs = {
                showSearch: true,
                allowFreeTextInput: true,
                collectionData: rows
              };

              self._onChangeSchema();
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
              label: _t('form-components.editors.radio.true'),
              val: true
            }, {
              label: _t('form-components.editors.radio.false'),
              val: false
            }, {
              label: _t('form-components.editors.radio.null'),
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
  },

  _onChangeSchema: function () {
    this.trigger('changeSchema');
  }

});

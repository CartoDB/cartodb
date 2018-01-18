var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./connect-with-lines.tpl');
var ColumnOptions = require('builder/editor/layers/layer-content-views/analyses/column-options');

var CONNECT_WITH_LINES = require('./connect-with-lines-types');

var TYPE_TO_META_MAP = {};
CONNECT_WITH_LINES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

/**
 * Form model for a convex hull analysis
 */
module.exports = BaseAnalysisFormModel.extend({
  defaults: {
    closest: true,
    order_type: 'asc'
  },

  parse: function (attrs) {
    return _.defaults(
      _.pick(attrs, 'id', 'source'), // maintain default attrs
      this._typeDef(attrs.type).parse(attrs)
    );
  },

  validate: function () {
    var errors = BaseAnalysisFormModel.prototype.validate.apply(this, arguments);

    if (errors && errors.target_column) {
      if (!this._hasSecondGeometry()) {
        errors.target_column = _t('editor.layers.analysis-form.second-geom-required');
      }
    }

    return errors;
  },

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this._columnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'))
    });

    this._targetColumnOptions = new ColumnOptions({}, {
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'))
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);
    this.listenTo(this._targetColumnOptions, 'columnsFetched', this._setSchema);
    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._setSchema);

    this.on('change:target', this._onChangeTarget, this);
    this.on('change:type', this._onTypeChanged, this);
    this.on('change:group', this._setSchema, this);

    this._setSchema();
    this._fetchColumns();
  },

  _onTypeChanged: function () {
    this._replaceAttrs();
    this._setSchema();
  },

  _replaceAttrs: function () {
    var attrs = this.parse(this.attributes);
    this.clear({ silent: true });
    this.set('type', attrs.type, { silent: true }); // re-set type to avoid change:type event to trigger again
    this.set(_.extend(attrs, this.defaults));
  },

  updateNodeDefinition: function (nodeDefModel) {
    var attrs = this._formatAttrs(this.attributes);
    nodeDefModel.clear({ silent: true });
    nodeDefModel.set(attrs);
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = this._typeDef().formatAttrs(formAttrs, this._columnOptions);
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {
      type: this.get('type'),
      group: this.get('group'),
      parametersDataFields: this._typeDef().parametersDataFields
    };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source field in addition to the type-specific fields
    var fields = ['source', 'type'].concat(this._typeDef().parametersDataSchema.split(','));
    return _.pick(schema, fields);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: this._primarySourceSchemaItem(),
      type: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.type'),
        dialogMode: 'float',
        options: CONNECT_WITH_LINES.map(function (d) {
          return {
            val: d.type,
            label: d.label
          };
        }, this)
      },
      source_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.base-layer'),
        placeholder: _t('editor.layers.analysis-form.select-column'),
        dialogMode: 'float',
        options: this._getColumnOptions('source_column', ['string', 'number'])
      },
      target: {
        type: 'NodeDataset',
        title: _t('editor.layers.analysis-form.target'),
        options: this._getSourceOptionsForSource('target', 'point'),
        dialogMode: 'float',
        editorAttrs: {
          disabled: this._isSourceDisabled('target')
        },
        validators: ['required']
      },
      target_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.target-column'),
        dialogMode: 'float',
        options: this._getColumnOptionsForTarget()
      },
      target_source_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.target-column'),
        options: this._getTargetSourceColumnOptions('target_source_column'),
        placeholder: _t('editor.layers.analysis-form.select-column'),
        dialogMode: 'float',
        editorAttrs: {
          disabled: this._isTargetColumnDisabled()
        }
      },
      destination_longitude: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.longitude'),
        validators: ['required'],
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.enter-longitude')
        }
      },
      destination_latitude: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.latitude'),
        validators: ['required'],
        editorAttrs: {
          placeholder: _t('editor.layers.analysis-form.enter-latitude')
        }
      },
      closest: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.closeness'),
        options: [
          { label: _t('editor.layers.analysis-form.to-closest'), val: 'true' },
          { label: _t('editor.layers.analysis-form.all-to-all'), val: 'false' }
        ]
      },
      group: {
        type: 'Enabler',
        label: _t('editor.layers.analysis-form.group-by'),
        title: '',
        editorAttrs: {
          reversed: true
        }
      },
      category_column: {
        type: 'EnablerEditor',
        title: '',
        label: _t('editor.layers.analysis-form.group-by'),
        editor: {
          type: 'Select',
          options: this._columnOptions.all(),
          dialogMode: 'float',
          editorAttrs: {
            showLabel: false
          }
        }
      },
      order_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.order-by'),
        options: this._columnOptions.filterByType(['date', 'number']),
        dialogMode: 'float',
        validators: ['required']
      },
      order_type: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.order'),
        options: [
          { label: _t('editor.layers.analysis-form.asc'), val: 'asc' },
          { label: _t('editor.layers.analysis-form.desc'), val: 'desc' }
        ]
      }
    }));
  },

  _onChangeTarget: function () {
    this.set('target_source_column', '');
    this._analysisSourceOptionsModel.createSourceNodeUnlessExisting(this.get('target'));
    this._fetchColumns();
  },

  _fetchColumns: function () {
    var target = this.get('target');
    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(target);

    if (nodeDefModel) {
      this._targetColumnOptions.setNode(nodeDefModel);
    } else if (target) {
      this._targetColumnOptions.setDataset(target);
    }
  },

  _getColumnOptionsForTarget: function () {
    var columns = this._getColumnOptions('target_column', 'geometry');

    return _.reject(columns, function (column) {
      return (column.val === 'the_geom' || column.val === 'the_geom_webmercator');
    }, this);
  },

  _getColumnOptions: function (attr, attrType) {
    var opts = this._columnOptions.filterByType(attrType);

    if (this._columnOptions.get('columnsFetched') && this.get(attr)) {
      var attrExists = false;
      var value = this.get(attr);

      var customValue = {
        val: value,
        label: '"' + value + '"'
      };

      if (opts && opts.length) {
        attrExists = _.find(opts, function (attr) {
          return attr.val === customValue.val;
        });
      }

      if (!attrExists) {
        opts.push(customValue);
        opts = _.sortBy(opts, function (d) {
          return d.val;
        });
      }
    }

    return opts;
  },

  _getTargetSourceColumnOptions: function (attr) {
    var opts = this._targetColumnOptions.all();

    if (this._targetColumnOptions.get('columnsFetched') && this.get(attr)) {
      var attrExists = false;
      var value = this.get(attr);

      var customValue = {
        val: value,
        label: '"' + value + '"'
      };

      if (opts && opts.length) {
        attrExists = _.find(opts, function (attr) {
          return attr.val === customValue.val;
        });
      }

      if (!attrExists) {
        opts.push(customValue);
        opts = _.sortBy(opts, function (d) {
          return d.val;
        });
      }
    }
    return opts;
  },

  _typeDef: function (type) {
    type = type || this.get('type');
    return TYPE_TO_META_MAP[type];
  },

  _getSourceOptionsForSource: function (sourceAttrName, requiredSimpleGeometryType) {
    var currentSource = this.get(sourceAttrName);

    if (this._isFetchingOptions()) {
      return [{
        val: currentSource,
        label: _t('editor.layers.analysis-form.loading'),
        isLoading: true
      }];
    } else {
      // fetched
      var source = this._getSourceOption()[0];
      return this._analysisSourceOptionsModel
        .getSelectOptions(requiredSimpleGeometryType)
        .filter(function (d) {
          return d.val !== source.val && d.val !== source.layerName;
        });
    }
  },

  _hasSecondGeometry: function () {
    return this._getColumnOptionsForTarget().length;
  },

  _isTargetColumnDisabled: function () {
    return !this._targetColumnOptions.get('columnsFetched');
  },

  _isSourceDisabled: function (sourceAttrName) {
    return this._isPrimarySource(sourceAttrName) || this._isFetchingOptions();
  }
});

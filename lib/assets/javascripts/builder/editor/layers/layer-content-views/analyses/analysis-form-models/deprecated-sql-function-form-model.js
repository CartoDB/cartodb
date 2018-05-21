var _ = require('underscore');
var cdb = require('internal-carto.js');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var availableFunctionsQuery = require('./available-functions.tpl');
var template = require('./deprecated-sql-function.tpl');
var track = require('builder/helpers/errorTracking.js');

var REQUIRED_OPTS = [
  'configModel'
];

module.exports = BaseAnalysisFormModel.extend({
  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._SQL = new cdb.SQL({
      user: this._configModel.get('user_name'),
      sql_api_template: this._configModel.get('sql_api_template'),
      api_key: this._configModel.get('api_key')
    });

    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    this.set('fetchStatus', 'unfetched');
    this._functionsInfo = [];

    this._setSchema();
    this._initBinds();
    this._fetchAvailableFunctions();
  },

  _initBinds: function () {
    this.listenTo(this, 'change:fetchStatus', this._onFetchStatusChanged);
    this.listenTo(this, 'change:function_name', this._onFunctionSelected);
    this.listenTo(this._analysisSourceOptionsModel, 'change:fetching', this._onSourceOptionsFetched);
  },

  validate: function (attrs, options) {
    this._serializeFunctionArgs();

    return BaseAnalysisFormModel.prototype.validate.call(this, attrs, options);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    var fields = [];
    var data = {
      fields: ''
    };
    var selectedFunction = this._getSelectedFunction();
    if (selectedFunction) {
      if (selectedFunction.hasSecondaryNode) {
        fields.push('secondary_source');
      }

      _.reduce(selectedFunction.params, function (memo, value, key) {
        memo.push(key);
        return memo;
      }, fields, this);
    }
    data.fields = fields.join(',');

    return data;
  },

  _buildSchema: function () {
    var schema = {};
    var selectedFunction = this._getSelectedFunction();

    // Source
    schema.primary_source = this._primarySourceSchemaItem(_t('editor.layers.analysis-form.deprecated-sql-function.input'));

    // Function
    schema.function_name = {
      type: 'Select',
      title: _t('editor.layers.analysis-form.deprecated-sql-function.function'),
      options: this._parseFunctionOptions(),
      dialogMode: 'float',
      editorAttrs: this._getSelectFunctionAttrs()
    };

    if (selectedFunction) {
      if (selectedFunction.hasSecondaryNode) {
        schema.secondary_source = {
          type: 'NodeDataset',
          title: _t('editor.layers.analysis-form.deprecated-sql-function.target'),
          options: this._getSourceOptionsForSource({
            sourceAttrName: 'secondary_source'
          }),
          dialogMode: 'float',
          editorAttrs: {
            disabled: this._isSourceDisabled('secondary_source')
          },
          validators: ['required']
        };
      }

      _.each(selectedFunction.params, function (value, key) {
        this._addParamToSchema(key, selectedFunction.params[key], schema);
      }, this);
    }

    return schema;
  },

  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._buildSchema());
  },

  _addParamToSchema: function (key, type, schema) {
    var item = null;
    var initialValue = null;

    switch (type) {
      case 'string': {
        item = {
          type: 'Text',
          title: key,
          validators: ['required']
        };
        initialValue = '';
        break;
      }
      case 'number': {
        item = {
          type: 'Number',
          title: key,
          showSlider: false,
          validators: ['required']
        };
        initialValue = 0;
        break;
      }
      case 'boolean': {
        item = {
          type: 'Radio',
          title: key,
          options: [
            {val: 'true', label: 'true'},
            {val: 'false', label: 'false'}
          ]
        };
        initialValue = true;
        break;
      }
    }
    if (item) {
      schema[key] = item;
      if (!this.has(key)) {
        this.set(key, initialValue);
      }
    }
  },

  _onSourceOptionsFetched: function () {
    this._setSchema();
  },

  _onFetchStatusChanged: function () {
    this._setSchema();
  },

  _onFunctionSelected: function () {
    this._setSchema();
  },

  _getSelectedFunction: function () {
    var functionName = this.get('function_name');
    if (functionName) {
      return _.first(_.filter(this._functionsInfo, function (info) {
        return info.functionName === functionName;
      }, this));
    }
    return null;
  },

  _fetchAvailableFunctions: function () {
    var query = availableFunctionsQuery();
    this.set('fetchStatus', 'fetching');

    this._SQL.execute(query, null, {
      success: function (metadata) {
        this._functionsInfo = this._parseFunctionsMetadata(metadata);
        this.set('fetchStatus', 'fetched');
      }.bind(this),
      error: function (errors) {
        this.set('fetchStatus', 'error');
        if (errors && errors.responseJSON) {
          track(errors.responseJSON);
        }
      }.bind(this)
    });
  },

  _parseFunctionsMetadata: function (metadata) {
    if (!metadata || !metadata.rows) {
      return [];
    }

    return _.map(metadata.rows, function (data) {
      var info = {};
      info.functionName = this._capitalizeFunctionName(data.fn_name);
      info.hasSecondaryNode = data.has_secondary_node;
      info.params = {};
      for (var i = 0; i < data.params_names.length; i++) {
        info.params[data.params_names[i]] = data.params_types[i];
      }
      return info;
    }, this);
  },

  _capitalizeFunctionName: function (name) {
    var depExtRegex = /^dep_ext/i;
    return name && name.replace(depExtRegex, 'DEP_EXT');
  },

  _getSelectFunctionAttrs: function () {
    var fetchStatus = this.get('fetchStatus');
    var status = {
      disabled: true
    };

    switch (fetchStatus) {
      case 'unfetched':
        break;
      case 'fetching':
        status = {
          disabled: true,
          loading: true
        };
        break;
      case 'fetched': {
        status = {};
        if (this._functionsInfo.length > 0) {
          status.placeholder = _t('editor.layers.analysis-form.deprecated-sql-function.choose-function-small');
        }
        break;
      }
      case 'error': {
        status = {
          disabled: true,
          placeholder: 'error'
        };
        break;
      }
    }

    return status;
  },

  _parseFunctionOptions: function () {
    return _.map(this._functionsInfo, function (info) {
      return {
        val: info.functionName,
        label: info.functionName
      };
    }, this);
  },

  _serializeFunctionArgs: function () {
    var values = [];
    var selectedFunction = this._getSelectedFunction();
    if (selectedFunction) {
      values = _.reduce(selectedFunction.params, function (memo, value, key) {
        memo.push(this.get(key));
        return memo;
      }, [], this);

      this.set('function_args', values);
    }
  },

  _isPrimarySource: function (sourceAttrName) {
    return sourceAttrName === this.get('source');
  },

  _isSourceDisabled: function (sourceAttrName) {
    return this._isPrimarySource(sourceAttrName) || this._isFetchingOptions();
  }
});

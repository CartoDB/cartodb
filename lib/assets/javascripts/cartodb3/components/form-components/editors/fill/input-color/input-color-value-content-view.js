var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('../column-list-view');
var quantificationMethodItemTemplate = require('./quantification-method-item.tpl');
var InputColorRamps = require('./input-ramps/input-color-ramps');
var InputColorCategories = require('./input-categories/input-color-categories');

var QUANTIFICATION_METHODS = ['jenks', 'equal', 'headtails', 'quantiles', 'category'];
var EXCLUDED_COLUMNS = ['the_geom', 'the_geom_webmercator'];

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.query) throw new Error('query param is required');

    this._columns = opts.columns;
    this._configModel = opts.configModel;
    this._query = opts.query;
    this._categorizeColumns = opts.categorizeColumns;

    this._column = this._getColumn();
    this._columnType = this._column && this._column.type;

    this._initViews();

    this.model.bind('change:quantification', function () {
      if (this.model.get('quantification') !== 'category') {
        this.model.unset('domain');
      }
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(this._stackLayoutView.render().$el);
    return this;
  },

  _initViews: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return self._createColumnListView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createInputColorRamps(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createInputColorCategories(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createQuantificationListView(stackLayoutModel, opts).bind(self);
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    if (this.model.get('attribute')) {
      var hasDomain = this.model.get('domain') && this.model.get('domain').length;
      var hasRange = this.model.get('range') && this.model.get('range').length;
      var showCategories = (this._columnType === 'string') || (hasDomain && hasRange);

      if (showCategories) {
        this._stackLayoutView.model.set('position', 2);
      } else {
        this._stackLayoutView.model.set('position', 1);
      }
    }
  },

  _createInputColorCategories: function (stackLayoutModel, opts) {
    var view = new InputColorCategories({
      model: this.model,
      query: this._query,
      columns: this._columns,
      configModel: this._configModel
    });

    view.bind('selectQuantification', function (item) {
      stackLayoutModel.goToStep(3);
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(0);
    }, this);

    return view;
  },

  _createQuantificationListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      headerTitle: _t('form-components.editors.fill.quantification.title'),
      stackLayoutModel: stackLayoutModel,
      itemTemplate: quantificationMethodItemTemplate,
      columns: QUANTIFICATION_METHODS,
      showSearch: false
    });

    view.bind('selectItem', function (item) {
      this.model.set('quantification', item.get('val'));
      stackLayoutModel.goToStep(1);
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(0);
    }, this);

    return view;
  },

  _createInputColorRamps: function (stackLayoutModel, opts) {
    var view = new InputColorRamps({
      hideTabs: this.options.hideTabs,
      model: this.model
    });

    view.bind('switch', function () {
      stackLayoutModel.goToStep(2);
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    return view;
  },

  _getColumn: function (columnName) {
    return _.find(this._columns, function (column) {
      return column.label === (columnName || this.model.get('attribute'));
    }, this);
  },

  _createColumnListView: function (stackLayoutModel, opts) {
    var columns = _.reject(this._columns, function (column) {
      return column.type === 'geometry' || _.contains(EXCLUDED_COLUMNS, column.label);
    }, this);

    var view = new ColumnListView({
      stackLayoutModel: stackLayoutModel,
      columns: columns,
      showSearch: true,
      typeLabel: 'column'
    });

    view.bind('selectItem', function (item) {
      this._onChangeAttribute(item.get('val'), stackLayoutModel);
    }, this);

    return view;
  },

  _onChangeAttribute: function (columnName, stackLayoutModel) {
    this.model.unset('fixed', { silent: true });
    this.model.unset('quantification', { silent: true });
    this.model.unset('opacity', { silent: true });

    var validCategoryTypes = ['string', 'boolean'];

    this._column = this._getColumn(columnName);
    this._columnType = this._column && this._column.type;

    if (_.contains(validCategoryTypes, this._columnType) || this._categorizeColumns) {
      this.model.unset('bins', { silent: true });
      stackLayoutModel.goToStep(2);
    } else if (this._columnType === 'number') {
      this.model.unset('domain', { silent: true });
      stackLayoutModel.goToStep(1);
    }

    this.model.set('attribute', columnName);
    this.model.set('attribute_type', this._columnType);
  }
});

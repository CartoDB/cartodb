var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var ColumnListView = require('builder/components/custom-list/column-list/column-list-view');
var columnListQuantificationMethodItemTemplate = require('builder/components/custom-list/column-list/column-list-quantification-method-item.tpl');

var InputQuantitativeRamps = require('./input-quantitative-ramps/main-view');
var InputQualitativeRamps = require('./input-qualitative-ramps/main-view');

var FillConstants = require('builder/components/form-components/_constants/_fill');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var MetricsTypes = require('builder/components/metrics/metrics-types');

var StackViewSteps = {
  COLUMN_LIST_VIEW: 0,
  INPUT_QUALITATIVE_RAMPS_VIEW: 1,
  INPUT_QUANTITATIVE_RAMPS_VIEW: 2
};

var EXCLUDED_COLUMNS = ['the_geom', 'the_geom_webmercator'];
var REQUIRED_OPTS = [
  'columns',
  'configModel',
  'modals',
  'query',
  'userModel'
];

module.exports = CoreView.extend({
  module: 'components:form-components:editors:fill:input-color:input-color-value-content-view',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._settings = _.clone(FillConstants.Settings.COLOR);
    if (this.options.removeByValueCategory) {
      this._removeCategoryFrom(this._settings.quantifications.items);
    }

    this._categorizeColumns = options.categorizeColumns;
    this._imageEnabled = options.imageEnabled;
    this._hideTabs = options.hideTabs;

    this._column = this._getColumn();
    this._columnType = this._column && this._column.type;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:quantification', function () {
      if (this.model.previous('quantification') === 'category') {
        delete this.model.attributes.range;
      }

      if (this.model.get('quantification') !== 'category') {
        this.model.unset('domain');
      }
    });
  },

  _initViews: function () {
    var stackViewCollection = new Backbone.Collection([
      {
        createStackView: this._createColumnListView.bind(this)
      },
      {
        createStackView: this._createInputQuantitativeRamps.bind(this)
      },
      {
        createStackView: this._createInputQualitativeRamps.bind(this)
      }
    ]);

    if (!this._hideTabs || !_.contains(this._hideTabs, FillConstants.Tabs.QUANTIFICATION)) {
      stackViewCollection.push({ createStackView: this._createQuantificationListView.bind(this) });
    }

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    if (this.model.get('attribute')) {
      var hasDomain = this.model.get('domain') && this.model.get('domain').length;
      var hasRange = this.model.get('range') && this.model.get('range').length;
      var showCategories = (this._columnType === 'string') || (hasDomain && hasRange);

      if (showCategories) {
        this._stackLayoutView.model.set('position', StackViewSteps.INPUT_QUANTITATIVE_RAMPS_VIEW);
      } else {
        this._stackLayoutView.model.set('position', StackViewSteps.INPUT_QUALITATIVE_RAMPS_VIEW);
      }
    }

    this.$el.append(this._stackLayoutView.render().$el);
    this.addView(this._stackLayoutView);
  },

  _createInputQualitativeRamps: function (stackLayoutModel, options) {
    var view = new InputQualitativeRamps({
      model: this.model,
      query: this._query,
      columns: this._columns,
      configModel: this._configModel,
      userModel: this._userModel,
      modals: this._modals,
      hideTabs: this._hideTabs,
      imageEnabled: this._imageEnabled
    });

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(StackViewSteps.COLUMN_LIST_VIEW);
    }, this);

    return view;
  },

  _createQuantificationListView: function (stackLayoutModel, options) {
    var view = new ColumnListView({
      headerTitle: _t('form-components.editors.fill.quantification.title'),
      stackLayoutModel: stackLayoutModel,
      itemTemplate: columnListQuantificationMethodItemTemplate,
      columns: this._settings.quantifications.items,
      showSearch: false
    });

    view.bind('selectItem', function (item) {
      this.model.set('quantification', item.get('val'));
      stackLayoutModel.goToStep(StackViewSteps.INPUT_QUALITATIVE_RAMPS_VIEW);
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(StackViewSteps.COLUMN_LIST_VIEW);
    }, this);

    return view;
  },

  _removeCategoryFrom: function (items) {
    var categoryIndex = items.indexOf('category');
    if (categoryIndex !== -1) {
      items.splice(categoryIndex, 1);
    }
  },

  _createInputQuantitativeRamps: function (stackLayoutModel, options) {
    var settings = _.clone(FillConstants.Settings.COLOR_RAMPS);
    if (this.options.removeByValueCategory) {
      this._removeCategoryFrom(settings.quantifications.items);
    }

    var view = new InputQuantitativeRamps({
      hideTabs: this.options.hideTabs,
      model: this.model,
      settings: settings
    });

    view.bind('switch', function () {
      stackLayoutModel.goToStep(StackViewSteps.INPUT_QUANTITATIVE_RAMPS_VIEW);
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

  _createColumnListView: function (stackLayoutModel, options) {
    var view = new ColumnListView({
      stackLayoutModel: stackLayoutModel,
      columns: this._filteredColumns(),
      showSearch: true,
      typeLabel: 'column'
    });

    view.bind('selectItem', function (item) {
      this._onChangeAttribute(item.get('val'), stackLayoutModel);
    }, this);

    return view;
  },

  _filteredColumns: function () {
    var columns = _.reject(this._columns, function (column) {
      return column.type === 'geometry' || column.type === 'date' || _.contains(EXCLUDED_COLUMNS, column.label);
    }, this);

    if (this.options.hideNumericColumns) {
      // eg. color ramps on numeric fields are not currently supported when using torque animations
      columns = _.reject(columns, function (column) {
        return column.type === 'number';
      });
    }

    return columns;
  },

  _onChangeAttribute: function (columnName, stackLayoutModel) {
    var validCategoryTypes = ['string', 'boolean'];
    var attrsToUnset = ['image', 'fixed', 'quantification', 'opacity'];
    var wasQuantificationCategory = this.model.get('quantification') === 'category';

    this._column = this._getColumn(columnName);
    this._columnType = this._column && this._column.type;

    _.each(attrsToUnset, function (attr) {
      this.model.unset(attr, { silent: true });
    }, this);

    if (_.contains(validCategoryTypes, this._columnType) || this._categorizeColumns) {
      this.model.unset('bins', { silent: true });
      stackLayoutModel.goToStep(StackViewSteps.INPUT_QUANTITATIVE_RAMPS_VIEW);
    } else if (this._columnType === 'number') {
      this.model.unset('images', { silent: true });
      this.model.unset('domain', { silent: true });

      // Unset range if previous quantification was category
      if (wasQuantificationCategory) {
        this.model.unset('range', { silent: true });
      }

      stackLayoutModel.goToStep(StackViewSteps.INPUT_QUALITATIVE_RAMPS_VIEW);
    }

    var attrs = {
      attribute: columnName,
      attribute_type: this._columnType
    };

    this.model.set(attrs);
    MetricsTracker.track(MetricsTypes.STYLED_BY_VALUE, attrs);
  }
});

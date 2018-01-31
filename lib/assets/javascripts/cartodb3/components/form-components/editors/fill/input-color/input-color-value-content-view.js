var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('../column-list-view');
var quantificationMethodItemTemplate = require('./quantification-method-item.tpl');
var InputColorRamps = require('./input-ramps/input-color-ramps');
var InputColorCategories = require('./input-categories/input-color-categories');
var DefaultFillSettings = require('../default-fill-settings.json');
var checkAndBuildOpts = require('../../../../../helpers/required-opts');
var MetricsTracker = require('../../../../../components/metrics/metrics-tracker');

var EXCLUDED_COLUMNS = ['the_geom', 'the_geom_webmercator'];
var REQUIRED_OPTS = [
  'columns',
  'configModel',
  'modals',
  'query',
  'userModel'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._settings = DefaultFillSettings.color;

    this._categorizeColumns = opts.categorizeColumns;
    this._imageEnabled = opts.imageEnabled;
    this._hideTabs = opts.hideTabs;

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
    }]);

    if (!this._hideTabs || !_.contains(this._hideTabs, 'quantification')) {
      stackViewCollection.push({
        createStackView: function (stackLayoutModel, opts) {
          return self._createQuantificationListView(stackLayoutModel, opts).bind(self);
        }
      });
    }

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

    this.$el.append(this._stackLayoutView.render().$el);
    this.addView(this._stackLayoutView);
  },

  _createInputColorCategories: function (stackLayoutModel, opts) {
    var view = new InputColorCategories({
      model: this.model,
      query: this._query,
      columns: this._columns,
      configModel: this._configModel,
      userModel: this._userModel,
      modals: this._modals,
      hideTabs: this._hideTabs,
      imageEnabled: this._imageEnabled
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
      columns: this._settings.quantifications.items,
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
      return column.type === 'geometry' || column.type === 'date' || _.contains(EXCLUDED_COLUMNS, column.label);
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
      stackLayoutModel.goToStep(2);
    } else if (this._columnType === 'number') {
      this.model.unset('images', { silent: true });
      this.model.unset('domain', { silent: true });

      // Unset range if previous quantification was category
      if (wasQuantificationCategory) {
        this.model.unset('range', { silent: true });
      }

      stackLayoutModel.goToStep(1);
    }

    var attrs = {
      attribute: columnName,
      attribute_type: this._columnType
    };

    this.model.set(attrs);
    MetricsTracker.track('Styled by value', attrs);
  }
});

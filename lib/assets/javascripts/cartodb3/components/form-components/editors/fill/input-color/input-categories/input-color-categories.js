var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./input-color-categories.tpl');
var StackLayoutView = require('../../../../../../components/stack-layout/stack-layout-view');
var InputColorPickerView = require('../input-color-picker/input-color-picker-view');
var CategoriesListView = require('./input-color-categories-list-view');
var QuerySchemaModel = require('../../../../../../data/query-schema-model');

var DEFAULT_COLORS = ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#DDDDDD'];
var CATEGORY_QUERY = 'SELECT <%= column %>, count(<%= column %>) FROM (<%= sql %>) _table_sql GROUP BY <%= column %> ORDER BY count DESC LIMIT <%= max_values %>';
var MAX_VALUES = 9;

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.query) throw new Error('query param is required');

    this._columns = opts.columns;
    this._configModel = opts.configModel;
    this._query = opts.query;

    this._initBinds();
    this._initViews();
    if (!this.model.get('domain') || !this.model.get('range')) {
      this._fetchColumns();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      attribute: this.model.get('attribute')
    }));

    if (this._stackLayoutView) {
      this.$('.js-content').append(this._stackLayoutView.render().$el);
    }
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:attribute', this._fetchColumns, this);
  },

  _initViews: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return self._createRangeListView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createColorPickerView(stackLayoutModel, opts).bind(self);
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });
  },

  _getColumn: function () {
    return _.find(this._columns, function (column) {
      return column.label === this.model.get('attribute');
    }, this);
  },

  _fetchColumns: function () {
    if (!this.model.get('attribute')) {
      return;
    }

    this._column = this._getColumn();
    this._columnType = this._column && this._column.type;

    if (this._columnType !== 'string') {
      return;
    }

    this._querySchemaModel = new QuerySchemaModel(null, {
      configModel: this._configModel
    });

    var tmpl = _.template(CATEGORY_QUERY);

    this._querySchemaModel.set('query', tmpl({
      sql: this._query,
      column: this.model.get('attribute'),
      max_values: MAX_VALUES + 1
    }));

    this._querySchemaModel.on('change:status', this._onStatusChange, this);
    this._querySchemaModel.fetch();
  },

  _onStatusChange: function () {
    if (this._querySchemaModel.get('status') === 'fetching') {
      return;
    }

    var showOthers = false;

    var categoryNames = this._querySchemaModel.rowsSampleCollection.pluck(this.model.get('attribute'));

    if (categoryNames.length >= MAX_VALUES) {
      showOthers = true;
    }

    var domain = _.map(categoryNames, function (name, i) {
      return name;
    }).slice(0, MAX_VALUES).sort();

    var range = _.map(categoryNames, function (name, i) {
      return DEFAULT_COLORS[i];
    }).slice(0, MAX_VALUES);

    if (showOthers) {
      domain.unshift(_t('form-components.editors.fill.input-categories.others'));
      range.unshift(DEFAULT_COLORS[categoryNames.length]);
    }

    this.model.set({
      range: range,
      domain: domain
    });

    this._initViews();
    this.render();
  },

  _updateRange: function (categories) {
    var range = _.clone(this.model.get('range'));
    range[this._index] = categories[this._index].color;
    this.model.set('range', range);
  },

  _createColorPickerView: function (stackLayoutModel, opts) {
    var range = _.map(this.model.get('range'), function (color, i) {
      return { val: color, color: color, title: this.model.get('domain')[i] };
    }, this);

    var view = new InputColorPickerView({
      index: this._index,
      ramp: range
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('change', this._updateRange, this);
    view.bind('changeIndex', function (index) {
      this._index = index;
    }, this);

    return view;
  },

  _createRangeListView: function (stackLayoutModel, opts) {
    var view = new CategoriesListView({
      model: this.model
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('selectItem', function (index) {
      this._index = index;
      stackLayoutModel.nextStep();
    }, this);

    return view;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  }
});

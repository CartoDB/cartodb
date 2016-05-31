var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

var InputColorPickerView = require('../input-color/input-color-picker-view');
var CategoriesListView = require('./categories-list-view');
var ColumnListView = require('../column-list-view');
// var InputRampListView = require('../input-ramp/input-ramp-list-view');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');
var QuerySchemaModel = require('../../../../../data/query-schema-model');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');
    if (!opts.configModel) throw new Error('configModel param is required');

    this._columns = opts.columns;
    this._configModel = opts.configModel;

    this._initBinds();
    this._initViews();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(this._stackLayoutView.render().$el);
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:attribute', this._query, this);
  },

  _initViews: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return self._createColumnListView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createRampListView(stackLayoutModel, opts).bind(self);
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

  _query: function () {
    this.querySchemaModel = new QuerySchemaModel(null, {
      configModel: this._configModel
    });

    var tmpl = _.template('SELECT <%= column %>, count(<%= column %>) FROM (<%= sql %>) _table_sql GROUP BY <%= column %> ORDER BY count DESC LIMIT <%= max_values %> ');

    this.querySchemaModel.set('query', tmpl({
      sql: 'select * from sacramentorealestatetransactions_6', // TODO: replace with real table name
      column: this.model.get('attribute'),
      max_values: 10
    }));
  },

  _updateRamp: function (categories) {
    var ramp = this.model.get('ramp');
    ramp[this._index] = categories[this._index].color;
    this.model.set('ramp', ramp);
    this.trigger('change');
  },

  _createColorPickerView: function (stackLayoutModel, opts) {
    var ramp = _.map(this.model.get('ramp'), function (color, i) {
      return { val: color, color: color, title: this.model.get('domain')[i] };
    }, this);

    var view = new InputColorPickerView({
      index: this._index,
      ramp: ramp
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('change', this._updateRamp, this);
    view.bind('changeIndex', function (index) {
      this._index = index;
    }, this);

    return view;
  },

  _createColumnListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      stackLayoutModel: stackLayoutModel,
      columns: this._columns,
      showSearch: true,
      typeLabel: 'column'
    });

    view.bind('selectItem', function (value) {
      this.model.set('attribute', value);
      stackLayoutModel.nextStep();
    }, this);

    return view;
  },

  _createRampListView: function (stackLayoutModel, opts) {
    var view = new CategoriesListView({
      ramp: this.model.get('ramp'),
      domain: this.model.get('domain')
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('selectItem', function (index) {
      this._index = index;
      stackLayoutModel.nextStep();
    }, this);

    return view;
  }
});

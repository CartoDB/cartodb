var _ = require('underscore');
var CDB = require('cartodb.js');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./input-color-categories.tpl');
var StackLayoutView = require('../../../../../../components/stack-layout/stack-layout-view');
var InputColorPickerView = require('../input-color-picker/input-color-picker-view');
var CategoriesListView = require('./input-color-categories-list-view');
var rampList = require('cartocolor');
var AssetPickerView = require('../assets-picker/input-asset-picker-view');
var MAX_VALUES = 10;
// max values + "others" color
var DEFAULT_COLORS = _.clone(rampList.Prism[MAX_VALUES + 1]);

var queryTemplate = _.template('SELECT <%= column %>, count(<%= column %>) FROM (<%= sql %>) _table_sql GROUP BY <%= column %> ORDER BY count DESC, <%= column %> ASC LIMIT <%= max_values %>');

function _quote (c) {
  if (c && c !== true) {
    return '"' + c.toString().replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
  }
  return c;
}

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-quantification': '_onClickQuantification'
  },

  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.userModel) throw new Error('userModel param is required');
    if (!opts.query) throw new Error('query param is required');
    if (!opts.modals) throw new Error('modals param is required');

    this._columns = opts.columns;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._query = opts.query;
    this._modals = opts.modals;

    this._initBinds();
    this._initViews();

    if (!this.model.get('domain') || !this.model.get('range')) {
      this._fetchColumns();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var column = this._getColumn();
    var columnType = column && column.type;

    this.$el.append(template({
      columnType: columnType,
      attribute: this.model.get('attribute'),
      quantification: this.model.get('quantification') || 'category'
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
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createImagePickerView(stackLayoutModel, opts).bind(self);
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

    if (this._query) {
      this._startLoader();

      var sql = new CDB.SQL({
        user: this._configModel.get('user_name'),
        sql_api_template: this._configModel.get('sql_api_template'),
        api_key: this._configModel.get('api_key')
      });

      sql.execute(
        queryTemplate({
          sql: this._query,
          column: this.model.get('attribute'),
          max_values: MAX_VALUES + 1
        }),
        null,
        {
          success: this._onQueryDone.bind(this),
          error: function () {
            // TODO: what happens if fails?
          }
        }
      );
    } else {
      this._onQueryDone();
    }
  },

  _onQueryDone: function (data) {
    data = data || {};
    this._stopLoader();
    this._updateRangeAndDomain(data.rows);
    this._initViews();
    this.render();
  },

  _updateRangeAndDomain: function (rows) {
    rows = rows || [];
    var categoryNames = _.pluck(rows, this.model.get('attribute'));

    var domain = _.map(categoryNames, function (name, i) {
      return name;
    }).slice(0, MAX_VALUES);

    if (this.model.get('attribute_type') !== 'number') {
      domain = domain.filter(function (item, pos, self) {
        return self.indexOf(item) === pos;
      }).map(_quote);
    }

    var range = _.map(categoryNames, function (name, i) {
      return (i < MAX_VALUES) ? DEFAULT_COLORS[i] : DEFAULT_COLORS[MAX_VALUES + 1];
    });

    this.model.set({
      range: range,
      domain: domain
    });
  },

  _startLoader: function () {
    this.$('.js-loader').removeClass('is-hidden');
    this.$('.js-content').addClass('is-hidden');
  },

  _stopLoader: function () {
    this.$('.js-loader').addClass('is-hidden');
    this.$('.js-content').removeClass('is-hidden');
  },

  _getRange: function () {
    return _.map(this.model.get('range'), function (color, i) {
      return { val: color, color: color, title: this.model.get('domain')[i] };
    }, this);
  },

  _updateRange: function (categories) {
    var range = _.clone(this.model.get('range'));
    range[this._index] = categories[this._index].color;
    this.model.set('range', range);
  },

  _createColorPickerView: function (stackLayoutModel, opts) {
    var range = this._getRange();

    var opacity = typeof this.model.get('opacity') !== 'undefined' ? this.model.get('opacity') : 1;

    var view = new InputColorPickerView({
      index: this._index,
      ramp: range,
      opacity: opacity
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('goToAssetPicker', function () {
      stackLayoutModel.nextStep();
    }, this);

    view.bind('change', this._updateRange, this);
    view.bind('changeIndex', function (index) {
      this._index = index;
    }, this);
    view.bind('change:opacity', function (opacity) {
      this.model.set('opacity', opacity);
    }, this);

    return view;
  },

  _createRangeListView: function (stackLayoutModel, opts) {
    var view = new CategoriesListView({
      maxValues: MAX_VALUES,
      model: this.model
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('selectItem', function (item) {
      this._index = item.index;

      if (item.target === 'asset') {
        stackLayoutModel.goToStep(2);
      } else {
        stackLayoutModel.goToStep(1);
      }
    }, this);

    return view;
  },

  _createImagePickerView: function (stackLayoutModel, opts) {
    var range = this._getRange();

    var view = new AssetPickerView({
      userModel: this._userModel,
      configModel: this._configModel,
      index: this._index,
      ramp: range,
      modals: this._modals
    });

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(0);
    }, this);

    view.bind('goToColorPicker', function () {
      stackLayoutModel.prevStep();
    }, this);

    return view;
  },

  _onClickQuantification: function (e) {
    this.killEvent(e);
    this.trigger('selectQuantification', this);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  remove: function () {
    CoreView.prototype.remove.apply(this);
  }
}, {
  MAX_VALUES: MAX_VALUES
});

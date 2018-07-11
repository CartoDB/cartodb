var _ = require('underscore');
var cdb = require('internal-carto.js');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var mainViewTemplate = require('./main-view.tpl');

var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var AssetPickerView = require('../assets-picker/input-asset-picker-view');

var ColorRampsListView = require('./color-ramps-list/list-view/color-ramps-list-view');
var CategoriesListView = require('./categories-list/list-view/input-categories-list-view');
var InputColorPickerView = require('../input-color-picker/input-color-picker-view');
var FillConstants = require('builder/components/form-components/_constants/_fill');

var CartoColor = require('cartocolor');
var MAX_VALUES = 10;
var DEFAULT_COLORS = _.clone(CartoColor.Prism[MAX_VALUES + 1]); // max values + "others" color

var queryTemplate = _.template('SELECT <%= column %>, count(<%= column %>) FROM (<%= sql %>) _table_sql GROUP BY <%= column %> ORDER BY count DESC, <%= column %> ASC LIMIT <%= max_values %>');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'columns',
  'configModel',
  'modals',
  'query',
  'userModel'
];

var STEPS = {
  CATEGORIES_RAMPS_VIEW: 0,
  CATEGORIES_LIST_VIEW: 1,
  COLOR_PICKER_VIEW: 2,
  IMAGE_PICKER_VIEW: 3
};

module.exports = CoreView.extend({
  module: 'components:form-components:editors:fill:input-color:input-qualitative-ramps:main-view',

  events: {
    'click .js-back': '_onClickBack',
    'click .js-quantification': '_onClickQuantification'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._imageEnabled = opts.imageEnabled;
    this._hideTabs = opts.hideTabs;
    this._query = opts.query;
    this._viewModel = new Backbone.Model({
      step: 0,
      status: 'idle'
    });

    this.listenTo(this.model, 'change:attribute', this._fetchColumns);
    this.listenTo(this._viewModel, 'change:status', this.render);

    if (this.model.hasChanged('quantification')) {
      this._fetchColumns();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var column = this._getColumn();
    var columnType = column && column.type;
    var hideQuantification = !!(this._hideTabs && _.contains(this._hideTabs, FillConstants.Tabs.QUANTIFICATION));

    this.$el.append(mainViewTemplate({
      status: this._viewModel.get('status'),
      columnType: columnType,
      attribute: this.model.get('attribute'),
      quantification: this.model.get('quantification') || 'category',
      hideQuantification: hideQuantification
    }));

    this._generateStackLayoutView();

    return this;
  },

  _generateStackLayoutView: function () {
    var currentStep = this._viewModel.get('step');
    var stackViewCollection = new Backbone.Collection([
      {
        selected: currentStep === STEPS.CATEGORIES_RAMPS_VIEW,
        createStackView: this._createCategoriesRampsListView.bind(this)
      },
      {
        selected: currentStep === STEPS.CATEGORIES_LIST_VIEW,
        createStackView: this._createRangeListView.bind(this)
      },
      {
        selected: currentStep === STEPS.COLOR_PICKER_VIEW,
        createStackView: this._createColorPickerView.bind(this)
      }
    ]);

    if (this._iconStylingEnabled()) {
      stackViewCollection.add({
        selected: currentStep === STEPS.IMAGE_PICKER_VIEW,
        createStackView: this._createImagePickerView.bind(this)
      });
    }

    this._stackLayoutView = new StackLayoutView({ collection: stackViewCollection });
    this._stackLayoutView.bind('positionChanged', this._onStackLayoutPositionChange, this);

    this.$('.js-content').append(this._stackLayoutView.render().$el);
    this.addView(this._stackLayoutView);
  },

  _computeRequiredNumberOfColors: function () {
    return this.model.get('domain')
      ? Math.min(this.model.get('domain').length, MAX_VALUES + 1)
      : MAX_VALUES + 1;
  },

  _onStackLayoutPositionChange: function () {
    this.$('.js-prevStep').toggle(this._stackLayoutView.getCurrentPosition() === 0);
  },

  _iconStylingEnabled: function () {
    return this._imageEnabled;
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
      this._setViewStatus('loading');

      var sql = new cdb.SQL({
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
            this._setViewStatus('error');
          }.bind(this)
        }
      );
    } else {
      this._onQueryDone();
    }
  },

  _onQueryDone: function (data) {
    data = data || {};
    this._updateRangeAndDomain(data.rows);
    this._setViewStatus('idle');
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

    if (this._iconStylingEnabled()) {
      var images = _.map(categoryNames, function () {
        return '';
      });

      this.model.attributes.images = images;
    }

    this.model.set({
      range: range,
      domain: domain
    });
  },

  _setViewStatus: function (status) {
    var attrs = {
      status: status
    };

    if (status === 'loading') {
      attrs.step = 0;
    }

    this._viewModel.set(attrs);
  },

  _getRange: function () {
    return _.map(this.model.get('range'), function (color, i) {
      var range = {
        val: color,
        color: color,
        title: this.model.get('domain')[i]
      };

      if (this._iconStylingEnabled()) {
        range.image = this.model.get('images')[i];
      }

      return range;
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
    var imageEnabled = this.options.imageEnabled && this._index < MAX_VALUES; // Disable image for the last item ("Others")

    var view = new InputColorPickerView({
      index: this._index,
      ramp: range,
      opacity: opacity,
      imageEnabled: imageEnabled
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
      this.model.set('index', index);
    }, this);

    view.bind('change:opacity', function (opacity) {
      this.model.set('opacity', opacity);
    }, this);

    return view;
  },

  _createRangeListView: function (stackLayoutModel, opts) {
    var view = new CategoriesListView({
      model: this.model,
      maxValues: MAX_VALUES,
      imageEnabled: this._iconStylingEnabled(),
      requiredNumberOfColors: this._computeRequiredNumberOfColors()
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('selectItem', function (item) {
      this._index = item.index;

      if (item.target === 'asset') {
        stackLayoutModel.goToStep(STEPS.IMAGE_PICKER_VIEW);
      } else {
        stackLayoutModel.goToStep(STEPS.COLOR_PICKER_VIEW);
      }
    }, this);

    return view;
  },

  _createCategoriesRampsListView: function (stackLayoutModel, opts) {
    var view = new ColorRampsListView({
      model: this.model,
      maxValues: MAX_VALUES,
      requiredNumberOfColors: this._computeRequiredNumberOfColors()
    });

    var eventsToListen = [
      ColorRampsListView.EVENTS.RAMP_SELECTED,
      ColorRampsListView.EVENTS.CUSTOMIZE,
      ColorRampsListView.EVENTS.CUSTOM_COLOR
    ].join(' ');

    view.on(eventsToListen, function () {
      stackLayoutModel.goToStep(STEPS.CATEGORIES_LIST_VIEW);
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
      modals: this._modals,
      imageEnabled: this._iconStylingEnabled()
    });

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(STEPS.CATEGORIES_LIST_VIEW);
    }, this);

    view.bind('goToColorPicker', function () {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('changeIndex', function (index) {
      this._index = index;
    }, this);

    if (this._iconStylingEnabled()) {
      view.bind('change:image', this._onImageChanged, this);
    }

    return view;
  },

  _onImageChanged: function (data) {
    var images = _.clone(this.model.get('images'));
    images[this._index] = data.url;
    this.model.set('images', images);
  },

  _onClickQuantification: function (e) {
    this.killEvent(e);
    this.trigger('selectQuantification', this);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  }
}, {
  MAX_VALUES: MAX_VALUES
});

function _quote (c) {
  if (c && c !== true) {
    return '"' + c.toString().replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
  }
  return c;
}

var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var ColumnListView = require('builder/components/custom-list/column-list/column-list-view');
var columnListQuantificationMethodItemTemplate = require('builder/components/custom-list/column-list/column-list-quantification-method-item.tpl');
var InputRampContentView = require('./input-ramp-content-view');
var rampList = require('cartocolor');
var FillConstants = require('builder/components/form-components/_constants/_fill');

module.exports = CoreView.extend({
  module: 'components:form-components:editors:fill:input-color:input-quantitative-ramps:main-view',

  initialize: function (opts) {
    this._settings = opts.settings || FillConstants.Settings.COLOR_RAMPS;

    this._setupModel();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _setupModel: function () {
    var options = {};

    if (!this.model.get('quantification')) {
      options.quantification = this._settings.quantifications.items[this._settings.quantifications.defaultIndex];
    }

    if (!this.model.get('bins')) {
      options.bins = this._settings.bins.items[this._settings.bins.defaultIndex];
    }

    if (+this.model.get('bins') > +this._settings.bins.items[this._settings.bins.items.length - 1]) {
      options.bins = this._settings.bins.items[this._settings.bins.items.length - 1];
    }

    this.model.set(options);
  },

  _initBinds: function () {
    var range = this.model.get('range');

    this.listenTo(this.model, 'change:bins', this._updateRange);
    this.listenTo(this.model, 'change:attribute', this.render);
    this.listenTo(this.model, 'change:quantification', this._onChangeQuantification);

    this.model.unset('fixed');

    if (!range || !this._isValidRange(range)) {
      this.model.set('range', this._getDefaultRamp());
    }
  },

  // range minimun size should be 2
  _isValidRange: function (range) {
    return range && range.length > 1 || false;
  },

  _initViews: function () {
    var self = this;

    var collectionOptions = [
      {
        createStackView: function (stackLayoutModel, opts) {
          return self._createInputRampContentView(stackLayoutModel, opts).bind(self);
        }
      }
    ];

    if (!this.options.hideTabs || !_.contains(this.options.hideTabs, FillConstants.Tabs.QUANTIFICATION)) {
      collectionOptions.push(
        {
          createStackView: function (stackLayoutModel, opts) {
            return self._createQuantificationListView(stackLayoutModel, opts).bind(self);
          }
        }
      );
    }

    if (!this.options.hideTabs || !_.contains(this.options.hideTabs, FillConstants.Tabs.BINS)) {
      collectionOptions.push(
        {
          createStackView: function (stackLayoutModel, opts) {
            return self._createBinsListView(stackLayoutModel, opts).bind(self);
          }
        }
      );
    }

    var stackViewCollection = new Backbone.Collection(collectionOptions);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    this.$el.append(this._stackLayoutView.render().$el);
    this.addView(this._stackLayoutView);
  },

  _updateRange: function () {
    var previousBins = this.model.previous('bins');

    if (!previousBins) {
      return;
    }

    var previousRamps = _.find(rampList, function (ramp) {
      var previousRamp = ramp[previousBins];
      var range = this.model.get('range');
      return previousRamp && range && previousRamp.join('').toLowerCase() === range.join('').toLowerCase();
    }, this);

    if (previousRamps) {
      var bins = this.model.get('bins');
      this.model.set('range', previousRamps[bins]);
    }
  },

  _createInputRampContentView: function (stackLayoutModel, opts) {
    var view = new InputRampContentView({
      stackLayoutModel: stackLayoutModel,
      model: this.model
    });

    view.bind('back', function (value) {
      this.trigger('back');
    }, this);

    view.bind('selectItem', function (value) {
      this.model.unset('domain');
      this.model.set('range', value);
    }, this);

    view.bind('selectQuantification', function (value) {
      stackLayoutModel.goToStep(1);
    }, this);

    view.bind('selectBins', function (value) {
      stackLayoutModel.goToStep(2);
    }, this);

    return view;
  },

  _createBinsListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      headerTitle: _t('form-components.editors.fill.bins'),
      stackLayoutModel: stackLayoutModel,
      columns: this._settings.bins.items
    });

    view.bind('selectItem', function (item) {
      this.model.set('bins', item.get('val'));
      stackLayoutModel.goToStep(0);
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
      itemTemplate: columnListQuantificationMethodItemTemplate,
      columns: this._settings.quantifications.items,
      showSearch: false
    });

    view.bind('selectItem', function (item) {
      this.model.set('quantification', item.get('val'));
      stackLayoutModel.prevStep();
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(0);
    }, this);

    return view;
  },

  _getDefaultRamp: function () {
    return _.map(rampList, function (ramp) {
      return ramp[this.model.get('bins')];
    }, this)[0];
  },

  _onChangeQuantification: function () {
    if (this.model.get('quantification') === 'category') {
      this.trigger('switch', this);
    }
  },

  remove: function () {
    CoreView.prototype.remove.apply(this);
  }
});

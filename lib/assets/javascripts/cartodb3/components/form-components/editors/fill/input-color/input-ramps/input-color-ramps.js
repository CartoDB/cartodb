var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutView = require('../../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('../../column-list-view');
var quantificationMethodItemTemplate = require('./quantification-method-item.tpl');
var InputRampContentView = require('./input-ramp-content-view');
var rampList = require('cartocolor');
var TipsyTooltipView = require('../../../../../tipsy-tooltip-view.js');

var QUANTIFICATION_METHODS = ['jenks', 'equal', 'headtails', 'quantiles'];
var BINS = ['2', '3', '4', '5', '6', '7'];

module.exports = CoreView.extend({
  initialize: function (opts) {
    this._setupModel();
    this._initBinds();
    this._initViews();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(this._stackLayoutView.render().$el);

    this._createTooltip();

    return this;
  },

  _setupModel: function () {
    var options = {};

    if (!this.model.get('quantification')) {
      options.quantification = QUANTIFICATION_METHODS[0];
    }

    if (!this.model.get('bins')) {
      options.bins = BINS[1]; // select '3' as the default bin size
    }

    if (this.model.get('bins') > BINS[BINS.length - 1]) {
      options.bins = BINS[BINS.length - 1];
    }

    this.model.set(options);
  },

  _initBinds: function () {
    this.model.bind('change:bins', this._updateRange, this);
    this.model.bind('change:attribute', this.render, this);

    this.model.unset('fixed');

    if (!this.model.get('range')) {
      this.model.set('range', this._getDefaultRamp());
    }
  },

  _initViews: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return self._createInputRampContentView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createQuantificationListView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createBinsListView(stackLayoutModel, opts).bind(self);
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });
  },

  _createTooltip: function () {
    this._helpTooltip = new TipsyTooltipView({
      el: this.$('.js-switch'),
      gravity: 's',
      offset: 0,
      title: function () {
        return $(this).data('tooltip');
      }
    });
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

    view.bind('switch', function (value) {
      this.trigger('switch', this);
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
      columns: BINS
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
      itemTemplate: quantificationMethodItemTemplate,
      columns: QUANTIFICATION_METHODS,
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

  _removeTooltip: function () {
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
  },

  remove: function () {
    this._removeTooltip();
    CoreView.prototype.remove.apply(this);
  }
});

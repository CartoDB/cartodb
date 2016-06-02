var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
var StackLayoutView = require('../../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('../../column-list-view');
var InputRampContentView = require('./input-ramp-content-view');
var rampList = require('./ramps');

var QUANTIFICATION_METHODS = ['Jenks', 'Equal Interval', 'Heads/Tails', 'Quantiles']; // TODO: translate
var BINS = ['3', '4', '5', '6', '7'];

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    this._setupModel();
    this._initViews();

    if (!this.model.get('range')) {
      this.model.unset('fixed');
      this.model.set('range', this._getDefaultRamp());
    }
  },

  _getDefaultRamp: function () {
    return _.map(rampList, function (ramp) {
      return ramp[3];
    }, this)[0];
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(this._stackLayoutView.render().$el);
    return this;
  },

  _setupModel: function () {
    if (!this.model.get('quantification')) {
      this.model.set('quantification', QUANTIFICATION_METHODS[0]);
    }

    if (!this.model.get('bins')) {
      this.model.set('bins', BINS[0]);
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
      stackLayoutModel.nextStep();
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

    view.bind('selectItem', function (value) {
      this.model.set('bins', value);
      stackLayoutModel.goToStep(0);
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(0);
    }, this);

    return view;
  },

  _createQuantificationListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      headerTitle: _t('form-components.editors.fill.quantification'),
      stackLayoutModel: stackLayoutModel,
      columns: QUANTIFICATION_METHODS
    });

    view.bind('selectItem', function (value) {
      this.model.set('quantification', value);
      stackLayoutModel.prevStep();
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(0);
    }, this);

    return view;
  }
});

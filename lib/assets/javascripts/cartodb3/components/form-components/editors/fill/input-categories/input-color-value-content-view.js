var cdb = require('cartodb.js');
var Backbone = require('backbone');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('./input-categories-list-view');
var InputRampContentView = require('../input-ramp/input-ramp-content-view');

var QUANTIFICATION_METHODS = ['Jenks', 'Equal Interval', 'Heads/Tails', 'Quantile']; // TODO: translate
var BINS = ['3', '4', '5', '6', '7'];

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');
    this._columns = opts.columns;

    this._setupModel();
    this._initViews();
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
        return self._createColumnListView(stackLayoutModel, opts).bind(self);
      }
    }, {
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

    if (this.model.get('attribute')) {
      this._stackLayoutView.model.set('position', 1);
    }
  },

  _createInputRampContentView: function (stackLayoutModel, opts) {
    var view = new InputRampContentView({
      stackLayoutModel: stackLayoutModel,
      model: this.model,
      bins: this.model.get('bins'),
      attribute: this.model.get('attribute'),
      quantification: this.model.get('quantification')
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('selectItem', function (value) {
      this.model.set('range', value);
    }, this);

    view.bind('selectQuantification', function (value) {
      stackLayoutModel.nextStep();
    }, this);

    view.bind('selectBins', function (value) {
      stackLayoutModel.goToStep(3);
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

  _createBinsListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      headerTitle: _t('form-components.editors.fill.bins'),
      stackLayoutModel: stackLayoutModel,
      columns: BINS
    });

    view.bind('selectItem', function (value) {
      this.model.set('bins', value);
      stackLayoutModel.goToStep(1);
    }, this);

    view.bind('back', function (value) {
      stackLayoutModel.goToStep(1);
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
      stackLayoutModel.goToStep(1);
    }, this);

    return view;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
  }
});

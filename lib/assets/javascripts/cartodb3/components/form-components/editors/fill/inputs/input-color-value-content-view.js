var cdb = require('cartodb.js');
var Backbone = require('backbone');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('./column-list-view');
var InputRampContentView = require('./input-ramp-content-view');

var DISTRIBUTION_METHODS = ['Jenks', 'Equal Interval', 'Heads/Tails', 'Quantile']; // TODO: translate
var BUCKETS = ['3', '4', '5', '6', '7']; // TODO: translate

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    this._contentModel = new cdb.core.Model({
      buckets: this.options.buckets || BUCKETS[0],
      distribution: this.options.distributionMethod || DISTRIBUTION_METHODS[0]
    });

    this.add_related_model(this._contentModel);

    if (!opts.columns) throw new Error('columns is required');
    this._columns = opts.columns;

    this._createStackViewCollection();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(this._stackLayoutView.render().$el);
    return this;
  },

  _createStackViewCollection: function () {
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
        return self._createDistributionListView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createBucketListView(stackLayoutModel, opts).bind(self);
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });
  },

  _createInputRampContentView: function (stackLayoutModel, opts) {
    var view = new InputRampContentView({
      stackLayoutModel: stackLayoutModel,
      model: this.model,
      buckets: this._contentModel.get('buckets'),
      columnName: this._contentModel.get('column'),
      distribution: this._contentModel.get('distribution')
    });

    view.bind('back', function (value) {
      stackLayoutModel.prevStep();
    }, this);

    view.bind('selectItem', function (value) {
      console.log(value); // TODO: store selected value
    }, this);

    view.bind('selectDistribution', function (value) {
      console.log('test');
      stackLayoutModel.nextStep();
    }, this);

    view.bind('selectBuckets', function (value) {
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
      this._contentModel.set('column', value);
      stackLayoutModel.nextStep();
    }, this);

    return view;
  },

  _createBucketListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      stackLayoutModel: stackLayoutModel,
      columns: BUCKETS
    });

    view.bind('selectItem', function (value) {
      this._contentModel.set('buckets', value);
      stackLayoutModel.goToStep(1);
    }, this);

    return view;
  },

  _createDistributionListView: function (stackLayoutModel, opts) {
    var view = new ColumnListView({
      stackLayoutModel: stackLayoutModel,
      columns: DISTRIBUTION_METHODS
    });

    view.bind('selectItem', function (value) {
      this._contentModel.set('distribution', value);
      stackLayoutModel.prevStep();
    }, this);

    return view;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
  }
});

var cdb = require('cartodb.js');
var Backbone = require('backbone');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('./column-list-view');
var InputNumberContentView = require('./input-number-content-view');

var DISTRIBUTION_METHODS = ['Jenks', 'Equal Interval', 'Heads/Tails', 'Quantile']; // TODO: translate

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    var self = this;

    this._contentModel = new cdb.core.Model({
      distribution: this.options.distributionMethod || DISTRIBUTION_METHODS[0]
    });

    this.add_related_model(this._contentModel);

    if (!opts.columns) throw new Error('columns is required');
    this._columns = opts.columns;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        var view = new ColumnListView({
          stackLayoutModel: stackLayoutModel,
          columns: self._columns,
          showSearch: true,
          typeLabel: 'column'
        });

        view.bind('change', function (value) {
          self._contentModel.set('column', value);
          stackLayoutModel.nextStep();
        }, self);

        return view;
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var view = new InputNumberContentView({
          stackLayoutModel: stackLayoutModel,
          model: self.model,
          columnName: self._contentModel.get('column'),
          distribution: self._contentModel.get('distribution')
        });

        view.bind('back', function (value) {
          stackLayoutModel.prevStep();
        }, self);

        view.bind('next', function (value) {
          stackLayoutModel.nextStep();
        }, self);

        return view;
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var view = new ColumnListView({
          stackLayoutModel: stackLayoutModel,
          columns: DISTRIBUTION_METHODS,
          showSearch: false,
          typeLabel: 'method'
        });

        view.bind('change', function (value) {
          self._contentModel.set('distribution', value);
          stackLayoutModel.prevStep();
        }, self);

        return view;
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(this._stackLayoutView.render().$el);
    return this;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
  }
});

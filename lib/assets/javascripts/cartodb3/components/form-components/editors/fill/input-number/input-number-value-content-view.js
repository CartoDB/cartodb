var cdb = require('cartodb.js');
var Backbone = require('backbone');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('../column-list-view');
var quantificationMethodItemTemplate = require('./quantification-method-item.tpl');
var InputNumberContentView = require('./input-number-content-view');

var QUANTIFICATION_METHODS = [
  { label: 'Jenks', value: 'jenks' },
  { label: 'Equal Interval', value: 'equal' },
  { label: 'Heads/Tails', value: 'headtails' },
  { label: 'Quantiles', value: 'quantiles' }
]; // TODO: translate?

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
      this.model.set('quantification', QUANTIFICATION_METHODS[0].label);
    }
  },

  _initViews: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        var view = new ColumnListView({
          stackLayoutModel: stackLayoutModel,
          columns: self._columns,
          showSearch: true,
          typeLabel: 'column'
        });

        view.bind('selectItem', function (item) {
          self.model.set('attribute', item.get('val'));
          stackLayoutModel.nextStep();
        }, self);

        return view;
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var view = new InputNumberContentView({
          stackLayoutModel: stackLayoutModel,
          model: self.model,
          min: self.options.min,
          max: self.options.max
        });

        view.bind('back', function (value) {
          stackLayoutModel.prevStep();
        }, self);

        view.bind('selectQuantification', function (value) {
          stackLayoutModel.nextStep();
        }, self);

        return view;
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var view = new ColumnListView({
          headerTitle: _t('form-components.editors.fill.quantification'),
          stackLayoutModel: stackLayoutModel,
          columns: QUANTIFICATION_METHODS,
          itemTemplate: quantificationMethodItemTemplate,
          showSearch: false
        });

        view.bind('selectItem', function (item) {
          self.model.set('quantification', item.get('val'));
          stackLayoutModel.prevStep();
        }, self);

        view.bind('back', function (value) {
          stackLayoutModel.prevStep();
        }, self);

        return view;
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    if (this.model.get('attribute')) {
      this._stackLayoutView.model.set('position', 1);
    }
  },

  _onClickBack: function (e) {
    this.killEvent(e);
  }
});

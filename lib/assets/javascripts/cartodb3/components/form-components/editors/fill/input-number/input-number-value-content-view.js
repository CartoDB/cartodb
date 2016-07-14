var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutView = require('../../../../../components/stack-layout/stack-layout-view');
var ColumnListView = require('../column-list-view');
var quantificationMethodItemTemplate = require('./quantification-method-item.tpl');
var InputNumberContentView = require('./input-number-content-view');

/**
 * add the number of classes
 * change the max depending on the min
 * smaller values on top
 */
var COLUMN_PANE_INDEX = 0;
var MAIN_PAIN_INDEX = 1;
var QUANTIFICATION_PANE_INDEX = 2;

var QUANTIFICATION_METHODS = ['quantiles', 'jenks', 'equal', 'headtails'];

module.exports = CoreView.extend({
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
  },

  _initViews: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        var view = new ColumnListView({
          stackLayoutModel: stackLayoutModel,
          columns: self._columns.filter(function (f) {
            return f.type === 'number';
          }),
          showSearch: true,
          typeLabel: 'column'
        });

        view.bind('selectItem', function (item) {
          self.model.set('attribute', item.get('val'));
          var step = MAIN_PAIN_INDEX;
          if (!self.model.get('quantification')) {
            step = QUANTIFICATION_PANE_INDEX;
          }
          self._stackLayoutView.model.goToStep(step);
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
          headerTitle: _t('form-components.editors.fill.quantification.title'),
          stackLayoutModel: stackLayoutModel,
          columns: QUANTIFICATION_METHODS,
          itemTemplate: quantificationMethodItemTemplate,
          showSearch: false
        });

        view.bind('selectItem', function (item) {
          this.model.set('quantification', item.get('val'));
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

    var position = MAIN_PAIN_INDEX;

    if (!this.model.get('attribute')) {
      position = COLUMN_PANE_INDEX;
    } else if (!this.model.get('quantification')) {
      position = QUANTIFICATION_PANE_INDEX;
    }

    this._stackLayoutView.model.set('position', position);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
  }
});

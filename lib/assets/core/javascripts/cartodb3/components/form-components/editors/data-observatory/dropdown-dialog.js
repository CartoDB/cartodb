var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var StackLayoutView = require('../../../../components/stack-layout/stack-layout-view');

var REQUIRED_OPTS = [
  'measurements',
  'filters'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    // For internal state
    this.model = new Backbone.Model({
      visible: false
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._generateStackLayoutView();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:visible', function (mdl, isVisible) {
      isVisible ? this.render() : this.clearSubViews();
    });
  },

  _generateStackLayoutView: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return self._createListView(stackLayoutModel, opts).bind(self);
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return self._createFilterView(stackLayoutModel, opts).bind(self);
      }
    }]);

    this._stackLayoutView = new StackLayoutView({ collection: stackViewCollection });
    this.addView(this._stackLayoutView);
    this.$el.append(this._stackLayoutView.render().$el);
  },

  _createListView: function (stackLayoutModel, opts) {
    // var view = new InputColorPickerView({
    //   options: this._getMeasurements()
    // });

    // view.bind('filters', function () {
    //   stackLayoutModel.nextStep();
    // }, this);
    var view = new CoreView();
    return view;
  },

  _createFilterView: function (stackLayoutModel, opts) {
    // var view = new InputColorPickerView({
    //   options: this._getFilterOptions()
    // });

    // view.bind('back', function () {
    //   stackLayoutModel.prevStep();
    // }, this);
    var view = new CoreView();
    return view;
  },

  _getFilterOptions: function () {

  },

  _getMeasurements: function () {

  },

  hide: function () {
    this.model.set('visible', false);
  },

  toggle: function () {
    this.model.set('visible', !this.model.get('visible'));
  },

  isVisible: function () {
    return this.model.get('visible');
  },

  clean: function () {
    // Other ops here
    CoreView.prototype.clean.apply(this, arguments);
  }
});

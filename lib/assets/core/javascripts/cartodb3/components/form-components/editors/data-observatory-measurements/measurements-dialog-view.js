var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var MeasurementsView = require('./measurements-list-view');

var REQUIRED_OPTS = [
  'measurementsCollection'
];

module.exports = CoreView.extend({
  className: 'CDB-Box-modal CustomList',

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
    this._createListView();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:visible', function (mdl, isVisible) {
      isVisible ? this.render() : this.clearSubViews();
      this._toggleVisibility();
    });
  },

  _createListView: function (stackLayoutModel, opts) {
    var view = new MeasurementsView({
      measurementsCollection: this._measurementsCollection
    });

    this.addView(view);
    this.$el.append(view.render().el);
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

  _toggleVisibility: function () {
    this.$el.toggleClass('is-visible', !!this.isVisible());
  }
});

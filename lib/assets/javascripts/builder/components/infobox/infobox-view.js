var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('cartodb3/helpers/required-opts');

var REQUIRED_OPTS = [
  'infoboxModel',
  'infoboxCollection'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
    this._setSelectedModel();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._infoboxModel, 'change:state', this._onChangeState);
    this.listenTo(this._infoboxModel, 'change:visible', this.render);
  },

  _initViews: function () {
    var createContentView;

    if (this._selectedModel) {
      createContentView = this._selectedModel.get('createContentView');
      this.infoboxView = createContentView();
      this.$el.append(this.infoboxView.render().el);
      this.addView(this.infoboxView);
      this._initSubviewBinds();
    }
  },

  _setSelectedModel: function () {
    var state = this._infoboxModel.get('state');
    this._selectedModel = this._infoboxCollection.setSelected(state);
  },

  _onChangeState: function () {
    this._setSelectedModel();
    this.render();
  },

  _initSubviewBinds: function () {
    this.listenTo(this.infoboxView, 'action:main', this._onMainAction);
    this.listenTo(this.infoboxView, 'action:second', this._onSecondAction);
    this.listenTo(this.infoboxView, 'action:close', this._onClose);
  },

  _onMainAction: function () {
    var action = this._selectedModel.get('mainAction');
    action && action();
  },

  _onSecondAction: function () {
    var action = this._selectedModel.get('secondAction');
    action && action();
  },

  _onClose: function () {
    var action = this._selectedModel.get('closeAction');
    if (action) {
      action();
    } else {
      // if no action associated, we still need to hide the infobox
      this._infoboxModel.set('state', null);
    }
  }
});

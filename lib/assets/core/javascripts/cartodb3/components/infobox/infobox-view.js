var CoreView = require('backbone/core-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.infoboxModel) throw new Error('infoboxModel is required');
    if (!opts.infoboxCollection) throw new Error('infoboxCollection is required');

    this.infoboxModel = opts.infoboxModel;
    this.infoboxCollection = opts.infoboxCollection;

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
    this.listenTo(this.infoboxModel, 'change:state', this._onChangeState);
    this.listenTo(this.infoboxModel, 'change:visible', this.render);
    this.add_related_model(this.infoboxModel);
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
    var state = this.infoboxModel.get('state');
    this._selectedModel = this.infoboxCollection.setSelected(state);
  },

  _onChangeState: function () {
    this._setSelectedModel();
    this.render();
  },

  _initSubviewBinds: function () {
    this.infoboxView.on('action:main', this._onMainAction, this);
    this.infoboxView.on('action:second', this._onSecondAction, this);
  },

  _onMainAction: function () {
    var action = this._selectedModel.get('mainAction');
    action && action();
  },

  _onSecondAction: function () {
    var action = this._selectedModel.get('secondAction');
    action && action();
  }
});

var CoreView = require('backbone/core-view');
var InfoboxView = require('../../../../components/infobox/infobox-view');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'infoboxModel',
  'infoboxCollection',
  'model'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._model, 'change:userFetchModelState', this.render);
  },

  _initViews: function () {
    var view = new InfoboxView({
      infoboxModel: this._infoboxModel,
      infoboxCollection: this._infoboxCollection
    });
    this.addView(view);

    this.$el.append(view.render().$el);
  }
});

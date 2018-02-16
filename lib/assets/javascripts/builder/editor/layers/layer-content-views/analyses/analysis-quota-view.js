var CoreView = require('backbone/core-view');
var InfoboxView = require('builder/components/infobox/infobox-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'infoboxModel',
  'infoboxCollection'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var view = new InfoboxView({
      infoboxModel: this._infoboxModel,
      infoboxCollection: this._infoboxCollection
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }
});

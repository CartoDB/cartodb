var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./footer.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var LOADING = 'loading';

var REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'formModel'
];

module.exports = CoreView.extend({
  className: 'Editor-FooterInfoEditor',

  events: {
    'click .js-ok': '_finish'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new Backbone.Model({ state: '' });

    this.listenTo(this.model, 'change:state', this.render);
    this.listenTo(this._formModel, 'change:errors', this.render);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      isLoading: this._isLoading(),
      isDisabled: !(this._formModel.canExport() && !this._isLoading())
    }));

    return this;
  },

  stopLoader: function (e) {
    this.model.unset('state');
  },

  _isLoading: function () {
    return this.model.get('state') === LOADING;
  },

  _finish: function (e) {
    this.killEvent(e);
    this.model.set('state', LOADING);
    this.trigger('finish', this);
  }
});

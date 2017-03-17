var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./footer.tpl');
var checkAndBuildOpts = require('../../../helpers/required-opts');

var LOADING = 'loading';

var REQUIRED_OPTS = [
  'userModel',
  'configModel'
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
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      isLoading: this.model.get('state') === LOADING
    }));

    return this;
  },

  stop: function (e) {
    this.model.set('state', '');
  },

  _finish: function (e) {
    this.killEvent(e);
    this.model.set('state', LOADING);
    this.trigger('finish', this);
  }
});

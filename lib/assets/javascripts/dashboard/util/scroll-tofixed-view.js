var $ = require('jquery');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'el'
];

module.exports = CoreView.extend({

  events: {
    'click .js-foo': '_fooHandler'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._onWindowScroll = this._onWindowScroll.bind(this);

    this._topBoundary = this.$el.offset().top;
    this._initBinds();
  },

  _initBinds: function () {
    this._bindScroll();
  },

  _onWindowScroll: function () {
    this.$el.toggleClass('is-fixed', $(window).scrollTop() > this._topBoundary);
  },

  _unbindScroll: function () {
    $(window).unbind('scroll', this._onWindowScroll);
  },

  _bindScroll: function () {
    this._unbindScroll();
    $(window).bind('scroll', this._onWindowScroll);
  },

  clean: function () {
    this._unbindScroll();
  }
});

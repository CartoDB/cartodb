var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var TEMPLATES = {
  // Using <%= %> instead of <%- %> because if not / characters (for example) will be escaped
  regular: '<%- protocol %>://<%= mapsApiResource %>/api/v1/map/static/named/<%- tpl %>/<%- width %>/<%- height %>.png<%= authTokens %>',
  cdn: '<%- protocol %>://<%- cdn %>/<%- username %>/api/v1/map/static/named/<%- tpl %>/<%- width %>/<%- height %>.png<%= authTokens %>'
};

var REQUIRED_OPTS = [
  'config',
  'visId',
  'mapsApiResource',
  'username'
];

/**
 *  MapCard previews
 *
 */

module.exports = CoreView.extend({
  options: {
    width: 300,
    height: 170,
    privacy: 'PUBLIC',
    className: '',
    authTokens: []
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  load: function () {
    this._startLoader();
    this._loadFromVisId();

    return this;
  },

  _generateImageTemplate: function () {
    return 'tpl_' + this._visId.replace(/-/g, '_');
  },

  _loadFromVisId: function () {
    var protocol = this._isHTTPS() ? 'https' : 'http';
    var cdnConfig = this._config.get('cdn_url');
    var template = _.template(cdnConfig ? TEMPLATES['cdn'] : TEMPLATES['regular']);

    var options = {
      protocol: protocol,
      username: this._username,
      mapsApiResource: this._mapsApiResource,
      tpl: this._generateImageTemplate(),
      width: this.options.width,
      height: this.options.height,
      authTokens: this._generateAuthTokensParams()
    };

    if (cdnConfig) {
      options = _.extend(options, {
        cdn: cdnConfig[protocol]
      });
    }

    var url = template(options);

    this._loadImage({}, url);
  },

  _generateAuthTokensParams: function () {
    var authTokens = this.options.authTokens;
    if (authTokens && authTokens.length > 0) {
      return '?' + _.map(authTokens, function (t) { return 'auth_token=' + t; }).join('&');
    } else {
      return '';
    }
  },

  _isHTTPS: function () {
    return location.protocol.indexOf('https') === 0;
  },

  loadURL: function (url) {
    var $img = $('<img class="MapCard-preview" src="' + url + '" />');
    this.$el.append($img);

    if (this.options.className) {
      $img.addClass(this.options.className);
    }

    $img.fadeIn(250);
  },

  showError: function () {
    this._onError();
  },

  _startLoader: function () {
    this.$el.addClass('is-loading');
  },

  _stopLoader: function () {
    this.$el.removeClass('is-loading');
  },

  _onSuccess: function (url) {
    this._stopLoader();
    this.loadURL(url);
    this.trigger('loaded', url);
  },

  _onError: function () {
    this._stopLoader();
    this.$el.addClass('has-error');
    var $error = $('<div class="MapCard-error" />');
    this.$el.append($error);
    $error.fadeIn(250);
    this.trigger('error');
  },

  _loadImage: function (error, url) {
    var self = this;
    var img = new Image();

    img.onerror = function () {
      self._onError(error);
    };

    img.onload = function () {
      self._onSuccess(url);
    };

    try {
      img.src = url;
    } catch (err) {
      this._onError(err);
    }
  }

});

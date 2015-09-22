/**
 *  MapCard previews
 *
 */
module.exports = cdb.core.View.extend({

  default_options: {
    width: 300,
    height: 170
  },

  templates: {
    regular: '<%- protocol %>://<%- username %>.<%- account_host %>/api/v1/map/static/named/<%- tpl %>/<%- width %>/<%- height %>.png',
    cdn: '<%- protocol %>://<%- cdn %>/<%- username %>/api/v1/map/static/named/<%- tpl %>/<%- width %>/<%- height %>.png'
  },

  initialize: function() {
    _.bindAll(this, "_onImageCallback", "_onError", "_onSuccess");

    _.defaults(this.options, this.default_options);

    this.width   = this.options.width;
    this.height  = this.options.height;
    this.$el     = this.options.el;
    this.vizjson = this.options.vizjson;
    this.visId   = this.options.visId;
    this.privacy = this.options.privacy;
    this.user    = this.options.user;
  },

  load: function() {
    this._startLoader();

    if (this.vizjson) {
      this._loadFromVizJSON();
    } else {
      this._loadFromVisId();
    }

    return this;
  },

  _generateImageTemplate: function() {
    return 'tpl_' + this.visId.replace(/-/g, '_');
  },

  _loadFromVisId: function() {
    var protocol = this._isHTTPS() ? 'https': 'http';
    var template = _.template(this.options.cdn_config ? this.templates.cdn : this.templates.regular);

    var options = {
      protocol: protocol,
      username: this.options.username,
      account_host: this.options.account_host,
      tpl: this._generateImageTemplate(),
      width: this.width,
      height: this.height
    };

    if (this.options.cdn_config) {
      options = _.extend(options, { cdn: this.options.cdn_config[protocol] });
    }

    var url = template(options);

    this._loadImage({}, url);
  },

  _loadFromVizJSON: function() {
    var url = this.vizjson;

    var image = cdb.Image(url, { override_bbox: true, https: this._isHTTPS() });

    if (this.options.zoom) {
      image.zoom(this.options.zoom).size(this.width, this.height).getUrl(this._onImageCallback);
    } else {
      image.size(this.width, this.height).getUrl(this._onImageCallback);
    }
  },

  _isHTTPS: function() {
    return location.protocol.indexOf("https") === 0;
  },

  _startLoader: function() {
    this.$el.addClass("is-loading");
  },

  _stopLoader: function() {
    this.$el.removeClass("is-loading");
  },

  loadURL: function(url) {
    var $img = $('<img class="MapCard-preview" src="' + url + '" />');
    this.$el.append($img);

    if (this.options.className) {
      $img.addClass(this.options.className);
    }

    $img.fadeIn(250);
  },

  showError: function() {
    this._onError();
  },

  _onSuccess: function(url) {
    this._stopLoader();

    this.loadURL(url);

    this.trigger("loaded", url);

  },

  _onError: function(error) {
    this._stopLoader();
    this.$el.addClass("has-error");
    var $error = $('<div class="MapCard-error" />');
    this.$el.append($error);
    $error.fadeIn(250);

    this.trigger("error");
  },

  _loadImage: function(error, url) {
    var self = this;
    var img  = new Image();

    img.onerror = function() {
      self._onError(error);
    };

    img.onload = function() {
      self._onSuccess(url);
    };

    try {
      img.src = url;
    } catch(err) {
      this._onError(err);
    }

  },

  _onImageCallback: function(error, url) {
    if (error) {
      this._onError(error);
      return
    }

    this._loadImage(error, url);
  }

});

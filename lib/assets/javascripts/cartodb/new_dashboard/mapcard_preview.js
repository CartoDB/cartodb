/**
 *  MapCard previews
 *
 */
module.exports = cdb.core.View.extend({

  options: {
    width: 300,
    height: 170
  },

  initialize: function() {

    _.bindAll(this, "_onImageCallback", "_onError", "_onSuccess");

    this.width   = this.options.width;
    this.height  = this.options.height;
    this.$el     = this.options.el;

  },

  load: function() {
    this._startLoader();
    cdb.Image(this.model.vizjsonURL()).size(this.width, this.height).getUrl(this._onImageCallback);
  },

  _startLoader: function() {
    this.$el.addClass("is-loading");
  },

  _stopLoader: function() {
    this.$el.removeClass("is-loading");
  },

  _onSuccess: function(url) {
    this._stopLoader();

    var $img = $('<img class="MapCard-preview" src="' + url + '" />');
    this.$el.append($img);
    $img.fadeIn(250);
  },

  _onError: function(error) {
    this._stopLoader();
    this.$el.addClass("has-error");

    var r = Math.round(Math.random() * 4);
    var $error = $('<div class="MapCard-error error-0' + r + '" />');
    this.$el.append($error);
    $error.fadeIn(250);
  },

  _onImageCallback: function(error, url) {

    var self = this;

    if (error) {
      this._onError(error);
      return
    }

    var img = new Image(); 

    img.onerror = function() {
      self._onError(error);
    };

    img.onload = function() {
      self._onSuccess(url);
    };

    img.src = url;

  }

});

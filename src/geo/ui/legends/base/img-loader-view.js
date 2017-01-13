var $ = require('jquery');
var Backbone = require('backbone');
var util = require('../../../../core/util');

module.exports = Backbone.View.extend({
  initialize: function (opts) {
    if (!opts.el) { throw new Error('element is mandatory.'); }
    if (!opts.imageClass) { throw new Error('Image class is mandatory.'); }

    this._color = this.$el.data('color');
    this._icon = this.$el.data('icon');

    this._imageClass = opts.imageClass;
    this._lastImage = {
      url: null,
      content: null
    };
  },

  _loadImage: function () {
    var self = this;
    var isSVG = this._isSVG(this._icon);

    if (this.$el.length === 0) {
      return;
    }

    if (isSVG) {
      this._requestImage(this._icon, function (content) {
        var svg = content.cloneNode(true);
        var $svg = $(svg);
        $svg = $svg.removeAttr('xmlns:a');
        $svg.attr('class', self._imageClass + ' js-image');

        self.$el.empty().append($svg);

        $svg.css('fill', self._color);
        $svg.find('path').css('fill', 'inherit');
      });
    } else {
      var $img = $('<img crossorigin="anonymous"/>');
      $img.attr('class', self._imageClass + ' js-image');
      $img.attr('src', this._icon + '?req=markup');
      this.$el.empty().append($img);
    }
  },

  _requestImage: function (url, callback) {
    var self = this;
    var completeUrl = url + '?req=ajax';

    if (this._lastImage.url === completeUrl) {
      callback && callback(this._lastImage.content);
    } else {
      $.ajax(completeUrl)
      .done(function (data) {
        self._lastImage.url = completeUrl;
        var content = self._lastImage.content = data.getElementsByTagName('svg')[0];
        callback && callback(content);
      })
      .fail(function () {
        throw new Error("Couldn't get " + completeUrl + ' file.');
      });
    }
  },

  _updateImageColor: function (color) {
    this.$('.js-image').css('fill', color);
  },

  _isSVG: function (url) {
    if (!url) {
      return false;
    }
    var noQueryString = url.split('?')[0];
    return noQueryString && util.endsWith(noQueryString.toUpperCase(), 'SVG');
  }
});

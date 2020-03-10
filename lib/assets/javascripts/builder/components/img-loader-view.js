require('jquery-migrate');

var $ = require('jquery');
var CoreView = require('backbone/core-view');
var utils = require('builder/helpers/utils');
var _ = require('underscore');

var IMAGE_DIM = 18;
var IMAGE_FILE_ATTRS = {
  width: '18px',
  height: '18px'
};

var VIEWBOX = _.template('0 0 <%- w %> <%- h %>');
module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.imageClass) { throw new Error('Image class is mandatory.'); }

    this._imageClass = opts.imageClass;
    this._imageURL = opts.imageUrl;
    this._color = opts.color;

    this._lastImage = {
      url: null,
      content: null
    };
  },

  render: function () {
    this.$el.empty();

    this._loadImage();

    return this;
  },

  _loadImage: function () {
    if (!this._imageURL) { // the URL could be null or undefined
      return;
    }

    var self = this;

    if (this._isSVG(this._imageURL)) {
      this._loadSVG();
    } else {
      var $img = $('<img crossorigin="anonymous"/>');
      $img.attr('class', self._imageClass + ' js-image');
      $img.attr('src', this._imageURL + '?req=markup');

      for (var attribute in IMAGE_FILE_ATTRS) {
        $img.attr(attribute, IMAGE_FILE_ATTRS[attribute]);
      }

      this.$el.append($img);
    }
  },

  _loadSVG: function () {
    var self = this;

    this._requestImageURL(this._imageURL, function (content) {
      var svg = '' + content + '';
      var $svg = $(svg);

      $svg = $svg.removeAttr('xmlns:a');
      $svg.attr('class', self._imageClass + ' js-image');

      if (!$svg.attr('viewBox')) {
        var bbox = {
          w: IMAGE_DIM,
          h: IMAGE_DIM
        };

        $svg.attr('viewBox', VIEWBOX(bbox));
      }

      for (var attribute in IMAGE_FILE_ATTRS) {
        $svg.attr(attribute, IMAGE_FILE_ATTRS[attribute]);
      }

      self.$el.append($svg);

      $svg.css('fill', self._color);
      $svg.find('g').css('fill', 'inherit');
      $svg.find('path').css('fill', 'inherit');
      $svg.find('rect').each(function (_, rect) {
        var $rect = $(rect);
        if ($rect.css('fill') !== 'none') {
          $rect.css('fill', 'inherit');
        }
      });
    });
  },

  _requestImageURL: function (url, callback) {
    var self = this;
    var completeUrl = url + '?req=ajax';

    if (this._lastImage.url === completeUrl) {
      callback && callback(this._lastImage.content);
    } else {
      $.ajax(completeUrl)
        .then(function (data) {
          self._lastImage.url = completeUrl;
          var content = self._lastImage.content = data;
          callback && callback(content);
        })
        .catch(function (error) {
          throw new Error("Couldn't get " + completeUrl + ' file.' + error);
        });
    }
  },

  updateImageColor: function (color) {
    this.$('.js-image').css('fill', color);
  },

  _isSVG: function (url) {
    if (!url) {
      return false;
    }
    var noQueryString = url.split('?')[0];
    return noQueryString && utils.endsWith(noQueryString.toUpperCase(), 'SVG');
  }
});

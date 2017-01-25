var $ = require('jquery');
var CoreView = require('backbone/core-view');
var utils = require('../helpers/utils');

var IMAGE_FILE_ATTRS = {
  width: '18px',
  height: '18px'
};

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.imageClass) {
      throw new Error('Image class is mandatory.');
    }
    this._imageClass = opts.imageClass;
    this._lastImage = {
      url: null,
      content: null
    };
  },

  getRampItem: function () {
    var ramp = this.model.get('ramp');

    if (!ramp) {
      return {
        color: '',
        title: _t('form-components.editors.fill.input-categories.others'),
        image: ''
      };
    }

    return ramp[this.model.get('index')];
  },

  _loadImage: function (imageUrl, color) {
    var self = this;
    var isSVG = this._isSVG(imageUrl);
    var $imgContainer = this.$('.js-image-container');
    if ($imgContainer.length === 0) {
      return;
    }

    if (isSVG) {
      this._requestImage(imageUrl, function (content) {
        var svg = content.cloneNode(true);
        var $svg = $(svg);
        $svg = $svg.removeAttr('xmlns:a');
        $svg.attr('class', self._imageClass + ' js-image');

        for (var attribute in IMAGE_FILE_ATTRS) {
          $svg.attr(attribute, IMAGE_FILE_ATTRS[attribute]);
        }

        $imgContainer.empty().append($svg);

        $svg.css('fill', color);
        $svg.find('path').css('fill', 'inherit');
      });
    } else {
      var $img = $('<img crossorigin="anonymous"/>');
      $img.attr('class', self._imageClass + ' js-image');
      $img.attr('src', imageUrl + '?req=markup');

      for (var attribute in IMAGE_FILE_ATTRS) {
        $img.attr(attribute, IMAGE_FILE_ATTRS[attribute]);
      }

      $imgContainer.empty().append($img);
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
    return noQueryString && utils.endsWith(noQueryString.toUpperCase(), 'SVG');
  }
});

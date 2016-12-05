var CoreView = require('backbone/core-view');
var template = require('./tab-pane-file.tpl');

/**
 *  File component
 */

module.exports = CoreView.extend({
  tagName: 'i',

  className: 'CDB-IconFont',

  initialize: function (options) {
    if (!this.model) {
      throw new Error('A model should be provided');
    }

    this.model.bind('change:label', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      url: this.model.get('label')
    }));

    var extra = this.model.get('extra');
    var color = extra && extra.color ? extra.color : '';

    this.$('.js-label').css({ fill: color });

    return this;
  },

  _loadSVG: function (src) {
    var self = this;

    var img = new Image(); /*eslint-disable */

    img.onload = function () {
      var $img = self.$('.js-label');
      var imgClass = $img.attr('class');

      var $svg = jQuery('<svg><image /></svg>'); /*eslint-disable */
      var $i = $svg.find('image');
      $svg = $svg.attr('class', imgClass);
      $svg = $svg.removeAttr('xmlns:a');

      $i.attr('x', 0);
      $i.attr('y', 0);
      $i.attr('width', this.width + 'px');
      $i.attr('height', this.height + 'px');

      $i = $i.attr('xlink:href', src);

      $img.replaceWith($svg);
    };

    img.onerror = function (e) {

    };

    img.src = src;
  }
});

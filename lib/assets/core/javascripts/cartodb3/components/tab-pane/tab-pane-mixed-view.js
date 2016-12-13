var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./tab-pane-file.tpl');

/**
 *  File component
 */

module.exports = CoreView.extend({
  tagName: 'i',

  className: 'CDB-IconFont',

  initialize: function (options) {
    if (!this.model) throw new Error('A model should be provided');

    this.model.bind('change:label', this.render, this);
    this.model.bind('change:color', this._updateColor, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      type: this._getType(),
      label: this.model.get('label'),
      selectedChild: this.model.get('selectedChild') || ''
    }));

    if (this._getType() === 'file') {
      var color = this.model.get('color');
      this.$('.js-label').css({ fill: color });
    }

    this._loadSVG();

    return this;
  },

  _updateColor: function () {
    this.$('.js-label').css('fill', this.model.get('color'));
  },

  _getType: function () {
    return this.model.get('label') && this.model.get('label').match(/^http/) ? 'file' : 'text';
  },

  _loadSVG: function () {
    var self = this;

    var $img = this.$('.js-label');
    var src = $img.attr('src');
    var attributes = $img.prop('attributes');

    $.get(src, function (data) {
      var $svg = $(data).find('svg');

      $svg = $svg.removeAttr('xmlns:a');

      $.each(attributes, function () {
        $svg.attr(this.name, this.value);
      });

      $img.replaceWith($svg);
      $svg.css('fill', self.model.get('color'));
      $svg.find('path').css('fill', 'inherit');
    }, 'xml');
  }
});

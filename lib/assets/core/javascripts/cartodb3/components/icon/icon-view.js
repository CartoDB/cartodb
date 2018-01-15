var $ = require('jquery');
var CoreView = require('backbone/core-view');
var iconTemplates = {};

var importAllIconTemplates = function () {
  var templates = require.context('./templates', false, /\.tpl$/);

  templates.keys().forEach(function (template) {
    iconTemplates[template] = templates(template);
  });
};

importAllIconTemplates();

module.exports = CoreView.extend({
  constructor: function (opts) {
    this.placeholder = this._preinitializeWithPlaceholder(opts && opts.placeholder);
    CoreView.prototype.constructor.call(this, opts);
  },

  initialize: function (opts) {
    if (!opts || !opts.icon) throw new Error('An icon is required to render IconView');

    this.icon = opts.icon;
    this.iconTemplate = this._getIconTemplate(this.icon);

    if (!this.iconTemplate) {
      throw new Error('The selected icon does not have any available template');
    }
  },

  render: function () {
    this.$el.html(this.iconTemplate);

    if (this.placeholder) {
      this.placeholder.replaceWith(this.$el);
    }

    return this;
  },

  _getIconTemplate: function (icon) {
    var iconTemplate = './' + this.icon + '.tpl';
    return iconTemplates[iconTemplate];
  },

  _preinitializeWithPlaceholder: function (placeholderNode) {
    if (!placeholderNode) {
      return;
    }

    var placeholder = $(placeholderNode);
    this.tagName = placeholder.prop('tagName');
    this.className = placeholder.attr('class');

    return placeholder;
  }
});

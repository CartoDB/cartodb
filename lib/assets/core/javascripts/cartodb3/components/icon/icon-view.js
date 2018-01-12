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
  initialize: function (opts) {
    if (!opts || !opts.icon) throw new Error('An icon is required to render IconView');

    this.icon = opts && opts.icon;
    this.placeholder = opts && opts.placeholder;
  },

  render: function () {
    var currentIconTemplate = './' + this.icon + '.tpl';
    this.$el.html(iconTemplates[currentIconTemplate]());

    if (this.placeholder) {
      var placeholder = $(this.placeholder);
      this.$el.removeClass().addClass(placeholder.attr('class'));
      placeholder.replaceWith(this.$el);
    }

    return this;
  }
});

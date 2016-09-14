var Backbone = require('backbone');
var sanitize = require('../../../../core/sanitize');
var legendTitleTemplate = require('./legend-title.tpl');

var LegendViewBase = Backbone.View.extend({

  className: 'CDB-Legend-item',

  initialize: function (deps) {
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(this._generateHTML());
    if (this.model.isVisible()) {
      this.$el.show();
    } else {
      this.$el.hide();
    }
    return this;
  },

  _generateHTML: function () {
    return this._getLegendHTML();
  },

  _getLegendHTML: function () {
    var html = [];

    // Legend title
    if (this.model.get('title')) {
      html.push(legendTitleTemplate({ title: this.model.get('title') }));
    }

    // Pre HTML Snippet
    if (this.model.get('preHTMLSnippet')) {
      html.push(this._sanitize(this.model.get('preHTMLSnippet')));
    }

    // Template
    html.push(this._sanitize(this._getCompiledTemplate()));

    // Post HTML Snippet
    if (this.model.get('postHTMLSnippet')) {
      html.push(this._sanitize(this.model.get('postHTMLSnippet')));
    }

    return html.join('\n');
  },

  _getCompiledTemplate: function () {
    throw new Error('Subclasses of LegendViewBase must implement _getCompiledTemplate');
  },

  _afterRender: function () { },

  _sanitize: function (html) {
    return sanitize.html(html);
  },

  enable: function () {
    this.$el.removeClass('is-disabled');
  },

  disable: function () {
    this.$el.addClass('is-disabled');
  }
});

module.exports = LegendViewBase;

var _ = require('underscore');
var Backbone = require('backbone');
var sanitize = require('../../../../core/sanitize');
var legendTitleTemplate = require('./legend-title.tpl');
var ImageLoaderView = require('./img-loader-view');

var LegendViewBase = Backbone.View.extend({

  className: 'CDB-Legend-item',

  initialize: function (opts) {
    this._placeholderTemplate = opts.placeholderTemplate;

    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(this._generateHTML());

    this._loadImages();

    this.model.isVisible()
      ? this.$el.show()
      : this.$el.hide();

    this._toggleLoadingClass();

    return this;
  },

  _generateHTML: function () {
    var html = [];
    if (this.model.isSuccess()) {
      this.model.isAvailable()
        ? html.push(this._getLegendHTML())
        : html.push(this._generateTitle({ title: 'No data available', error: true }));
    }

    if (this.model.isError()) {
      html.push(this._generateTitle({ title: 'Legend unavailable', error: true }));
    }

    if (this.model.isError() || this.model.isLoading() || (this.model.isSuccess() && !this.model.isAvailable())) {
      html.push(this._getPlaceholderHTML());
    }

    return html.join('\n');
  },

  _getLegendHTML: function () {
    var html = [];

    // Legend title
    if (this.model.get('title')) {
      html.push(this._generateTitle({ title: this.model.get('title') }));
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

  _generateTitle: function (data) {
    return legendTitleTemplate({ title: data.title, error: !!data.error });
  },

  _getPlaceholderHTML: function () {
    return (this._placeholderTemplate && this._placeholderTemplate()) || '';
  },

  _getCompiledTemplate: function () {
    throw new Error('Subclasses of LegendViewBase must implement _getCompiledTemplate');
  },

  _afterRender: function () { },

  _sanitize: function (html) {
    return sanitize.html(html);
  },

  _toggleLoadingClass: function () {
    this.$el.toggleClass('is-loading', this.model.isLoading());
  },

  _loadImages: function () {
    _.each(this.$('.js-image-container'), function ($el) {
      var iconView = new ImageLoaderView({
        el: $el,
        imageClass: 'Legend-fillImageAsset'
      });

      iconView._loadImage();
    });
  }
});

module.exports = LegendViewBase;

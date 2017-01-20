var _ = require('underscore');
var Backbone = require('backbone');
var errorTitleTemplate = require('./error-title.tpl');
var noDataAvailableTitleTemplate = require('./no-data-available-title.tpl');
var sanitize = require('../../../../core/sanitize');
var legendTitleTemplate = require('./legend-title.tpl');
var ImageLoaderView = require('./img-loader-view');

var LegendViewBase = Backbone.View.extend({

  className: 'CDB-Legend-item',

  initialize: function (deps) {
    this._placeholderTemplate = deps.placeholderTemplate;

    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(this._generateHTML());

    this._loadImages();

    if (this.model.isVisible()) {
      this.$el.show();
    } else {
      this.$el.hide();
    }

    this._toggleLoadingClass();

    return this;
  },

  _generateHTML: function () {
    var html = [];
    if (this.model.isSuccess()) {
      if (this.model.isAvailable()) {
        html.push(this._getLegendHTML());
      } else {
        html.push(this._getNoDataAvailableHTML());
        html.push(this._getPlaceholderHTML());
      }
    } else if (this.model.isError()) {
      html.push(this._getErrorHeaderHTML());
      html.push(this._getPlaceholderHTML());
    } else if (this.model.isLoading()) {
      html.push(this._getPlaceholderHTML());
    }
    return html.join('\n');
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

  _getPlaceholderHTML: function () {
    return this._placeholderTemplate && this._placeholderTemplate() || '';
  },

  _getErrorHeaderHTML: function () {
    return errorTitleTemplate();
  },

  _getNoDataAvailableHTML: function () {
    return noDataAvailableTitleTemplate();
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

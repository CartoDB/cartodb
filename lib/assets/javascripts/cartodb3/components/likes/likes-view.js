var cdb = require('cartodb-deep-insights.js');
var template = require('./likes.tpl');

/**
 * Responsible for likes (♥ 123) and its toggling behaviour.
 */
module.exports = cdb.core.View.extend({
  tagName: 'a',

  events: {
    'click': '_toggleLike'
  },

  initialize: function () {
    this.model.bind('change:likeable change:liked change:likes error', this.render, this);
  },

  render: function () {
    this.$el.html(
      template({
        likes: this.model.get('likes'),
        size: this.model.get('size'),
        show_count: this.model.get('show_count'),
        show_label: this.model.get('show_label')
      })
    );
    this.$el.attr({
      class: this._classNames(),
      href: this._hrefLocation()
    });

    return this;
  },

  _hrefLocation: function () {
    var href = '#/like';

    if (!this.model.get('likeable')) {
      href = window.login_url;
    }

    return href;
  },

  _classNames: function () {
    var classNames = ['LikesIndicator'];

    if (this.model.get('likeable')) {
      classNames.push('is-likeable');
    }

    if (this.model.get('liked')) {
      classNames.push('is-liked');
    }

    if (this._animate) {
      classNames.push('is-animated');
      this.$el.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
        // unset animate and force re-render to avoid race conditions
        this._animate = false;
        this.render();
      }.bind(this));
    }

    return classNames.join(' ');
  },

  _toggleLike: function (ev) {
    if (this.model.get('likeable')) {
      this.killEvent(ev);

      this._animate = true;
      this.model.toggleLiked();
    }
  }
});

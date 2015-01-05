var cdb = require('cartodb.js');

/**
 * Responsible for likes (♥ 123) and its toggling behaviour.
 */
module.exports = cdb.core.View.extend({
  tagName: 'a',

  events: {
    'click': '_toggleLike'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('new_common/views/likes/template');
    this.model.bind('change:liked change:likes error', this.render, this);
  },

  render: function() {
    this.$el.html(
        this.template({
          m: this.model
        })
      )
      .attr({
        class: this._classNames()
      });

    return this;
  },

  _classNames: function() {
    var classNames = ['LikesIndicator'];

    if (this.model.get('liked')) {
      classNames.push('LikesIndicator--liked');
    }

    if (this._animate) {
      classNames.push('LikesIndicator--animated');
      this.$el.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
        // unset animate and force re-render to avoid race conditions
        this._animate = false;
        this.render();
      }.bind(this));
    }

    return classNames.join(' ')
  },

  _toggleLike: function(ev) {
    this.killEvent(ev);
    this._animate = true;
    this.model.toggleLiked();
  }
});

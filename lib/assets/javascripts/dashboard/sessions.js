const $ = require('jquery');
const _ = require('underscore');
const CoreView = require('backbone/core-view');
const TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

/**
 *  Sessions view
 */

$(function () {
  const Sessions = CoreView.extend({

    el: document.body,

    events: {
      'submit .js-Loading-form': '_checkForm',
      'click .js-sharedSecret-link': '_toggleQr',
      'click .js-skipMfa-link': '_submitSkipMfa'
    },

    initialize: function () {
      this._initViews();
      this._focusVerification();
    },

    _initViews: function () {
      _.each(this.$('.js-Sessions-fieldError'), element => this._initFieldError(element));
    },

    _initFieldError: function (el) {
      const errorTooltip = new TipsyTooltipView({
        el: $(el),
        fade: true,
        gravity: 's',
        offset: 0,
        className: 'errorTooltip',
        title: function () {
          return $(el).data('content');
        }
      });
      this.addView(errorTooltip);
    },

    _checkForm: function () {
      const $loading = this.$('.js-Loading');

      $loading.prop('disabled', true);

      $loading.css({
        width: $loading.outerWidth(),
        height: $loading.outerHeight()
      });

      $loading.find('.js-Loading-text').hide();
      $loading.find('.js-Loading-anim').show();
    },

    _toggleQr: function () {
      this.$('.Sessions-centered .Sessions-toggle').toggleClass('is-active');
    },

    _focusVerification: function () {
      this.$('.js-verification').focus();
    },

    _submitSkipMfa: function () {
      this.$('.Sessions-footer').closest('form').submit();
    }
  });

  window.sessions = new Sessions();
});

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
      'submit .js-Loading-form': '_checkForm'
    },

    initialize: function () {
      this._initViews();
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
    }

  });

  window.sessions = new Sessions();
});

/**
 *  Sessions view
 */

$(function() {

  var Sessions = cdb.core.View.extend({

    el: document.body,

    events: {
      'submit .js-Loading-form': '_checkForm',
    },

    initialize: function() {
      this._initViews();
    },

    _initViews: function() {
      var self = this;

      _.each(this.$('.js-Sessions-fieldError'), function(el) {
        self._initFieldError(el);
      })
    },

    _initFieldError: function(el) {
      $(el).tipsy({
        fade: true,
        gravity: "s",
        offset: 0,
        className: 'errorTooltip',
        title: function() {
          return $(el).data('content')
        }
      });
    },

    _checkForm: function() {
      var $loading = this.$('.js-Loading');

      $loading.prop('disabled', true);

      $loading.css({
        width: $loading.outerWidth(),
        height: $loading.outerHeight()
      });

      $loading.find(".js-Loading-text").hide();
      $loading.find(".js-Loading-anim").show();
    }

  });

  window.sessions = new Sessions();

});
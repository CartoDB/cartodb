
$(function() {

  /**
   *  Signup view
   *
   */

  var Signup = Backbone.View.extend({

    el: document.body,

    events: {
      'submit .js-Loading-form': '_checkForm',
      'click .js-Carrousel-navLink': '_onCLickCarrouselNavLink'
    },

    initialize: function() {
      this._initViews();
      this.animationPlay;
      this._animate();
    },

    _initViews: function() {
      var self = this;

      _.each(this.$('.js-Sessions-fieldError'), function(el) {
        self._initFieldError(el);
      })
    },

    _onCLickCarrouselNavLink: function(e) {
      e.preventDefault();

      var $target = $(e.target);
      var x = $target.closest('.js-Carrousel-navItem').index();

      this._restartAnimation();
      clearInterval(this.animationPlay);
      this._changeMenu($target, x);
      this._animate();
    },

    _animate: function() {
      var self = this;

      this.animationPlay = setInterval(function() {
        var x = $('.js-Carrousel-navItem.is-active').index()+1;
        var y = $('.js-Carrousel-navItem.is-active').next().find('.js-Carrousel-navLink');

        if (x < $('.js-Carrousel-navItem').length) {
          self._changeMenu (y, x);
          self._restartAnimation();
        } else {
          var x = 0;
          var y = $('.js-Carrousel-navLink')[0];

          self._changeMenu (y, x);
          self._restartAnimation();
        }
      }, 5000);
    },

    _changeMenu: function(y, x) {
      this.$('.js-Carrousel-navItem').removeClass ('is-active');
      this.$('.js-Carrousel-slide').removeClass ('is-active');
      this.$('.js-Carrousel-textItem').removeClass ('is-active');

      $(y).closest('.js-Carrousel-navItem').addClass('is-active');

      var z = $('.js-Carrousel-slide')[x];
      $(z).addClass('is-active');

      var t = $('.js-Carrousel-textItem')[x];
      $(t).addClass('is-active');
    },

    _restartAnimation: function() {
      var progress = $('<div>').append(this.$('.js-Progress').clone()).remove().html();

      this.$('.js-Progress').remove();
      this.$('.js-Browser-media').prepend(progress);
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


  window.signup = new Signup();
});

function input_value (inputId) {
  var input = document.getElementById('user_google_sign_in');
  if (input === null) {
    return null;
  } else {
    return input.value;
  }
}

function valid_google_signup () {
  return input_value('user_google_sign_in') === 'true' && input_value('user_email') !== '' && input_value('user_username') !== '';
}

var has_errors = document.getElementById('has_errors');
if (valid_google_signup() && has_errors != null && has_errors.value === 'false') {
  document.getElementById('user_terms').checked = true;
  document.getElementById('user_google_sign_in').form.submit();
} else {
  $('.Sessions-loggedin').removeClass('is-active');
  $('.Sessions-notloggedin').addClass('is-active');
}

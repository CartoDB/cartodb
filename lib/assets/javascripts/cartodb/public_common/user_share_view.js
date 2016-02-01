var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');

/**
 * View to interact with the share buttons in the content.
 *
 * - Twitter code from https://dev.twitter.com/web/intents
 *
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-Navmenu-shareLink': '_onClickShareLink',
    'click .js-Navmenu-closeLink': '_onClickCloseLink',
    'click .js-Navmenu-link--facebook': '_onClickFacebookLink',
    'click .js-Navmenu-link--linkedin': '_onClickLinkedinLink'
  },

  initialize: function() {
    this.$shareList = $('.js-Navmenu-shareList');

    this.model.on("change:active", this._toggleShare, this);

    this._initBindings();
  },

  _initBindings: function() {
    if (window.__twitterIntentHandler) return;
   
    if (document.addEventListener) {
      document.addEventListener('click', this._handleIntent, false);
    } else if (document.attachEvent) {
      document.attachEvent('onclick', this._handleIntent);
    }
    window.__twitterIntentHandler = true;
  },

  _onClickLinkedinLink: function(e) {
    var href = $(e.target).closest('a').attr('href'),
        m, left, top;

    var windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes',
        width = 550,
        height = 420,
        winHeight = screen.height,
        winWidth = screen.width;

    left = Math.round((winWidth / 2) - (width / 2));
    top = 0;

    if (winHeight > height) {
      top = Math.round((winHeight / 2) - (height / 2));
      console.log(top);
    }
    
    window.open(href, 'facebook', windowOptions + ',width=' + width +
                                       ',height=' + height + ',left=' + left + ',top=' + top);

    e.returnValue = false;
    e.preventDefault && e.preventDefault();
  },

  _onClickFacebookLink: function(e) {
    var href = $(e.target).closest('a').attr('href'),
        m, left, top;

    var windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes',
        width = 550,
        height = 420,
        winHeight = screen.height,
        winWidth = screen.width;

    left = Math.round((winWidth / 2) - (width / 2));
    top = 0;

    if (winHeight > height) {
      top = Math.round((winHeight / 2) - (height / 2));
      console.log(top);
    }
    
    window.open(href, 'facebook', windowOptions + ',width=' + width +
                                       ',height=' + height + ',left=' + left + ',top=' + top);

    e.returnValue = false;
    e.preventDefault && e.preventDefault();
  },

  _handleIntent: function(e) {
    e = e || window.event;
    var target = e.target || e.srcElement,
        m, left, top;
 
    while (target && target.nodeName.toLowerCase() !== 'a') {
      target = target.parentNode;
    }
 
    if (target && target.nodeName.toLowerCase() === 'a' && target.href) {
      var intentRegex = /twitter\.com(\:\d{2,4})?\/intent\/(\w+)/,
          windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes',
          width = 550,
          height = 420,
          winHeight = screen.height,
          winWidth = screen.width;

      m = target.href.match(intentRegex);
      if (m) {
        left = Math.round((winWidth / 2) - (width / 2));
        top = 0;
 
        if (winHeight > height) {
          top = Math.round((winHeight / 2) - (height / 2));
        }
 
        window.open(target.href, 'intent', windowOptions + ',width=' + width +
                                           ',height=' + height + ',left=' + left + ',top=' + top);
        e.returnValue = false;
        e.preventDefault && e.preventDefault();
      }
    }
  },

  close: function() {
    this.model.set('active', false);
  },

  _onClickShareLink: function(e) {
    this.killEvent(e);

    this.model.set('active', !this.model.get('active'));
  },

  _onClickCloseLink: function(e) {
    this.close();
  },

  _toggleShare: function() {
    if (this.model.get('active')) {
      this.$shareList.addClass('is-active');
    } else {
      this.$shareList.removeClass('is-active');
    }
  }

});

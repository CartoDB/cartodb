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
    'click .js-Navmenu-editLink--more': '_onClickMoreLink'
  },

  initialize: function() {
    this.$metaList = this.$('.js-PublicMap-metaList--mobile');
    this.$moreLink = this.$('.js-Navmenu-editLink--more');

    this.model.on("change:active", this._toggleMeta, this);
  },

  _onClickMoreLink: function(e) {
    this.model.set('active', !this.model.get('active'));
  },

  _toggleMeta: function() {
    if (this.model.get('active')) {
      this.$moreLink.html('Less info');
      this.$metaList.slideDown(250);
    } else {
      this.$moreLink.html('More info');
      this.$metaList.slideUp(250);
    }
  }

});

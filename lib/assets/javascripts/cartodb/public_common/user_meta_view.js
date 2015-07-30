var cdb = require('cartodb.js');
var $ = require('jquery');

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

    this.model.on("change:active", this._toggleMeta, this);
  },

  _onClickMoreLink: function(e) {
    this.model.set('active', !this.model.get('active'));
  },

  _toggleMeta: function() {
    if (this.model.get('active')) {
      this.$metaList.slideDown(250);
    } else {
      this.$metaList.slideUp(250);
    }
  }

});

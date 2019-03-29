var cdb = require('cartodb.js-v3');
var ViewFactory = require('../../common/view_factory');
var randomQuote = require('../../common/view_helpers/random_quote');

/**
 * Model representing the router state
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    view: ''
  },

  createGroupView: function (groups, id, fetchedCallback) {
    var self = this;
    var group = groups.newGroupById(id);
    fetchedCallback = fetchedCallback.bind(this, group);

    var setFetchedCallbackView = function () {
      self.set('view', fetchedCallback());
    };

    if (group.get('display_name')) {
      setFetchedCallbackView();
    } else {
      // No display name == model not fetched yet, so show loading msg meanwhile
      this.createLoadingView('Loading group details');
      group.fetch({
        data: {
          fetch_users: true
        },
        success: function () {
          groups.add(group);
          setFetchedCallbackView();
        },
        error: this.createErrorView.bind(this)
      });
    }
  },

  createLoadingView: function (msg) {
    this.set('view', ViewFactory.createByTemplate('common/templates/loading', {
      title: msg,
      quote: randomQuote()
    }));
  },

  createErrorView: function () {
    // Generic error view for now
    this.set('view', ViewFactory.createByTemplate('common/templates/fail', {
      msg: ''
    }));
  }

});

var cdb = require('cartodb.js');
var ViewFactory = require('../common/view_factory');
var randomQuote = require('../common/view_helpers/random_quote');

/**
 * Model representing the router state
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    view: ''
  },

  initialize: function(attrs) {
    _.each(['groups'], function(name) {
      if (!attrs[name]) throw new Error(name + ' is required');
    }, this);
  },

  getOrNewGroup: function(id) {
    return this.get('groups').newGroupById(id);
  },

  createGroupView: function(id, fetchedCallback) {
    var group = this.getOrNewGroup(id);
    fetchedCallback = fetchedCallback.bind(this, group);

    if (group.get('display_name')) {
      fetchedCallback();
    } else {
      // No display name == model not fetched yet, so show loading msg meanwhile
      this.createLoadingView('Loading group details');
      var self = this;
      group.fetch({
        success: function() {
          self.get('groups').add(group);
          fetchedCallback();
        },
        error: this.createErrorView.bind(this)
      });
    }
  },

  createLoadingView: function(msg) {
    this.set('view', ViewFactory.createByTemplate('common/templates/loading', {
      title: msg,
      quote: randomQuote()
    }));
  },

  createErrorView: function() {
    // Generic error view for now
    this.set('view', ViewFactory.createByTemplate('common/templates/fail', {
      msg: ''
    }));
  }


});

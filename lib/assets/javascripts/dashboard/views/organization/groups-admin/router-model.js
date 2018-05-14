const Backbone = require('backbone');
const ViewFactory = require('builder/components/view-factory');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const errorTemplate = require('dashboard/views/data-library/content/error-template.tpl');
const randomQuote = require('builder/components/loading/random-quote');

/**
 * Model representing the router state
 */
module.exports = Backbone.Model.extend({
  defaults: {
    view: ''
  },

  createGroupView: function (groups, id, fetchedCallback) {
    const group = groups.newGroupById(id);
    fetchedCallback = fetchedCallback.bind(this, group);

    const setFetchedCallbackView = () => {
      this.set('view', fetchedCallback());
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
    this.set('view', ViewFactory.createByTemplate(loadingTemplate, {
      title: msg,
      descHTML: randomQuote()
    }));
  },

  createErrorView: function () {
    // Generic error view for now
    this.set('view', ViewFactory.createByTemplate(errorTemplate, {
      msg: ''
    }));
  }

});

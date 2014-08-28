
  /**
   *
   *
   *
   */

  cdb.admin.CommonData.Router = Backbone.Router.extend({

    routes: {
      // Tag
      ':tag': 'tag',
      // Latest
      'latest-additions': 'latest',
      // Index
      '': 'tables'
      
    },

    initialize: function() {
      // Start a model with default url params
      this.model = new cdb.core.Model({
        tag: '',
        latest: false
      });
    },

    index: function() {
      this.model.set({
        tag: '',
        latest: false
      });
    },

    latest: function() {
      this.model.set({
        tag: '',
        latest: true
      });
    },

    tag: function(tag) {
      this.model.set({
        tag: decodeURIComponent(tag),
        latest: false
      });
    },

  });
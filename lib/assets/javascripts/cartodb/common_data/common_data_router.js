
  /**
   *
   *
   *
   */

  cdb.admin.CommonData.Router = Backbone.Router.extend({

    routes: {
      // Index
      '':       'tables',
      '/:tag':  'tag'
    },

    initialize: function() {
      // Start a model with default url params
      this.model = new cdb.core.Model({ tag: '' });
    },

    index: function() {
      this.model.set('tag', '');
    },

    tag: function(tag) {
      this.model.set('tag', tag);
    },

  });
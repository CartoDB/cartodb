  
  /**
   *  New public table router \o/
   *
   *  - No more /#/xxx routes
   */

  cdb.open.TableRouter = Backbone.Router.extend({

    routes: {
      ':id/public/:scenario': 'change'
    },

    initialize: function(table) {
      this.table = table;
    },

    change: function(_id,scenario) {
      // Check active view, if it is different, change
      if (scenario != 'table' && scenario != 'map') scenario = 'table';
      this.table.workViewMobile.active(scenario);
    }

  });
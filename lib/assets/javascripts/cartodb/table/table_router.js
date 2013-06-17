  
  /**
   *  New table router \o/
   *
   *  - No more /#/xxx routes
   *  - Control if current visualization is a table or a viz
   */

  cdb.admin.TableRouter = Backbone.Router.extend({

    history: [],

    _TEXTS: {
      error: _t('Something went wrong, try again later')
    },

    routes: {
      ':type/:id/:scenario': 'change'
    },

    initialize: function(table) {
      this.table = table;
    },

    addToHistory: function() {
      this.history.push(Backbone.history.fragment);
    },

    change: function(type,_id,scenario) {
      var last_route = this.history.length > 0 && _.last(this.history).split('/');
      var loader = false;
      var isTable = false;
      var self = this;

      /*
        TODO: 
        - Show and hide loader.
        - Check if visualization fetched is the actual one and not other.
        - Check logs in console.
      */

      // Check if type has changed
      if (last_route && last_route.length > 0 && last_route[0] != type && type == "tables") {
        loader = true;
        isTable = true;

        var table = new cdb.admin.CartoDBTableMetadata({ id: _id });
        table.fetch({
          wait: true,
          success: function(m) {
            toVis(m.get("table_visualization").id);
          },
          fail: function() {
            self.globalError.showError(self._TEXTS.error, "error", 5000)
          }
        })
      }

      // Check if id has changed
      if (last_route && last_route.length > 1 && last_route[1] != _id) {

        // Show loader if it is not available
        if (!loader) loader = true;
        
        // Table id or visualization id
        if (!isTable) {
          toVis(_id);
        }
      }

      // Check active view, if it is different, change
      if (scenario != 'table' && scenario != 'map') scenario = 'table';
      this.table.activeView(scenario);

      // Add to history :)
      this.addToHistory();


      // Function to change to visualization
      function toVis(new_id) {
        self.table.vis
          .set('id', new_id)
          .fetch({
            wait: true,
            success: function(m) {
              // Hide loader :)
            }
          });
      }
    }

  });

  /**
   *  New table router \o/
   *
   *  - No more /#/xxx routes
   *  - Control if current visualization is a table or a viz
   */

  cdb.admin.TableRouter = Backbone.Router.extend({

    _TEXTS: {
      error: _t('Something went wrong, try again later')
    },

    routes: {
      ':type/:id':            'change',
      ':type/:id/':           'change',
      ':type/:id/:scenario':  'change'
    },

    initialize: function(table) {
      this.history = [];
      this.table = table;
      this.addToHistory();
    },

    changeToVis: function(vis) {
      // Get scenario param (table or map)
      var last_route = this.history.length > 0 && _.last(this.history).split('/');
      // Create url
      var url = "/viz/" + vis.get("id") + "/" + ( last_route[2] || 'table' );
      // Navigate
      this.navigate(url, { trigger: false });
      this.addToHistory();
    },

    addToHistory: function() {
      if (Backbone.history.fragment) {
        // I hate you double quotes!
        var fragment = (Backbone.history.fragment.replace(/"/g, ''));
        this.history.push(fragment);
      }
    },

    change: function(type, _id, scenario) {
      var last_route = this.history.length > 0 && _.compact(_.last(this.history).split('/'));
      var loader = false;
      var isTable = false;
      var self = this;

      // Change quotes by %22 (not encodeURIComponent for the moment).
      _id = _id.replace(/"/g,'');

      // Check if type has changed
      if (last_route && last_route.length > 0 && last_route[0] != type && type == "tables") {

        loader = true;
        isTable = true;
        self.table.showLoader('dataset');

        var table = new cdb.admin.CartoDBTableMetadata({ id: _id });
        table.fetch({
          wait: true,
          success: function(m) {
            toVis(m.get("table_visualization").id);
          },
          fail: function() {
            self.table.globalError.showError(self._TEXTS.error, "error", 5000)
          }
        })
      }

      // Check if id has changed
      if (last_route && last_route.length > 1 && last_route[1] != _id) {

        // Show loader if it is not available
        if (!loader) {
          self.table.showLoader('visualization');
        }

        // Table id or visualization id
        if (!isTable) {
          toVis(_id);
        }
      }

      // Check active view, if it is different, change
      if (scenario != 'table' && scenario != 'map') scenario = 'table';
      this.table.activeView(scenario);

      // Add to history :)
      this.addToHistory();


      // Function to change to visualization
      function toVis(new_id) {
        self.table.master_vis
          .set('id', new_id)
          .fetch({
            wait: true,
            success: function(vis) {
              // Get related tables if it is necessary
              vis.getRelatedTables();
              self.table.hideLoader();
            },
            error: function() {
              self.table.hideLoader();
              self.table.globalError.showError(self._TEXTS.error, "error", 5000);
            }
          });
      }
    },

    changeToMap: function() {
      var url = window.location.pathname;
      var tabName = url.substr(url.length - 4);
      if (tabName !== '/map') {
        url = url.substring(0,url.lastIndexOf("/table")) + '/map';
        this.navigate(url, { trigger: false });
        this.addToHistory();
      }
    },

    changeToDataset: function() {
      var url = window.location.pathname;
      var tabName = url.substr(url.length - 6);
      if (tabName !== '/table') {
        url = url.substring(0,url.lastIndexOf("/map")) + '/table';
        this.navigate(url, { trigger: false });
        this.addToHistory();
      }
    }

  });

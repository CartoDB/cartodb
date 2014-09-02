
  /**
   *  Content for GeocodingDialog class
   *    - It will render desired tabs for the dialog.
   *    - It will manage communication between tabs and dialog.
   *
   */

  cdb.admin.GeocodingDialog.Content = cdb.common.CreateDialog.Content.extend({

    _TABS: {
      lonlat:    {
        method: '_genLonLatPane',
        title:  _t('By Lon/Lat Columns'),
      },
      city:     {
        method: '_genCityPane',
        title:  _t('By City <br/>Names')
      },
      admin:   {
        method: '_genAdminPane',
        title:  _t('By Admin. Regions')
      },
      postal:  {
        method: '_genPostalPane',
        title:  _t('By Postal Codes')
      },
      ip:  {
        method:   '_genIPPane',
        title:    _t('By IP Addresses'),
      },
      address:  {
        method: '_genAddressPane',
        title:  _t('By Street Addresses')
      },
      error:     {
        method: '_genErrorPane',
        title:  _t('There has been an error with your geocoder')
      },
    },

    _TEXTS: {
      limits: {
        key:      _t('<%= name %> key is not specified and panel can\'t be enabled'),
        account:  _t('<%= name %> data source is not available in your plan. Please upgrade'),
        credits:  _t('You\'ve reached the available <%= name %> credits for your account this month'),
      }
    },

    events: {},

    ////////////////////
    // TABS && PANES! //
    ////////////////////

    _genPanes: function() {
      var self = this;

      // Create TabPane
      this.create_panes = new cdb.ui.common.TabPane({
        el: this.$(".create-panes")
      });
      this.addView(this.create_panes);

      // Link tabs with panes
      this.create_tabs.linkToPanel(this.create_panes);

      // Render desired panes!
      _.each(this.tabs, function(t) {
        if (self._TABS[t]) {
          var item = self[self._TABS[t].method]();
          if (item) {
            self.create_panes.addTab(t, item);
            item.render();
            self.addView(item);  
          } 
        } else {
          cdb.log.info('Create pane ' + t + ' doesn\'t exist');  
        }
      });
    },

    _genLonLatPane: function() {

      var latlng = new cdb.admin.GeocodingDialog.Pane.LonLat({
        table:    this.options.table,
        template: 'table/views/geocoding_dialog/geocoding_dialog_pane_lonlat'
      })

      return latlng;
    },

    _genCityPane: function() {
      var city = new cdb.admin.GeocodingDialog.Pane.City({
        table:    this.options.table,
        template: 'table/views/geocoding_dialog/geocoding_dialog_pane_city'
      })
      return city;
    },

    _genAdminPane: function() {
      var admin = new cdb.admin.GeocodingDialog.Pane.Admin({
        table:    this.options.table,
        template: 'table/views/geocoding_dialog/geocoding_dialog_pane_admin'
      })
      return admin;
    },

    _genPostalPane: function() {
      var postal = new cdb.admin.GeocodingDialog.Pane.Postal({
        table:    this.options.table,
        template: 'table/views/geocoding_dialog/geocoding_dialog_pane_postal'
      })
      return postal;
    },

    _genIPPane: function() {
      var ip = new cdb.admin.GeocodingDialog.Pane.IP({
        table:    this.options.table,
        template: 'table/views/geocoding_dialog/geocoding_dialog_pane_ip'
      })
      return ip;
    },

    _genAddressPane: function() {
      // Check geocoding credits!
      // if (!cdb.config.get('oauth_dropbox')) {
      //   this._setFailedTab('dropbox', 'key');
      //   return false;
      // }
      return new cdb.core.View();
    },

    _genSuccessPane: function() {
      return new cdb.admin.ImportSuccessPane({
        model: this.model
      });
    },

    _genErrorPane: function() {
      return new cdb.admin.ImportErrorPane({
        model: this.model
      });
    },

    _genActionsController: function() {
      // var actions = new cdb.common.CreateDialog.Actions({
      //   tabs:     this.create_tabs,
      //   panes:    this.create_panes,
      //   model:    this.model,
      //   states:   this.options.states,
      //   $dialog:  this.$dialog
      // });
      // this.addView(actions);
    },

    
    ////////////
    // Events //
    ////////////

    _onTabChange: function(tabName) {
      // if (tabName !== "error") {
      //   var values = this.create_panes.getPane(tabName).getValue()
      //   var upload = _.extend(values, { progress: 0 });

      //   this.model.set({
      //     option: tabName,
      //     upload: upload
      //   });  
      // }
      console.log("on tab change");
    },

    _onStateChange: function(m, c) {
      if (this.model.get('state') === "selected") {
        var pane = this.create_panes.getPane(this.model.get('option'));
        pane.setValue(this.model.get('geocoding'));
      }
      // if (this.model.get('state') === "error") {
      //   this.create_panes.active('error');
      // }
      console.log("state changed!");
    },

    _onValueChange: function() {
      // var values = this.create_panes.getActivePane().getValue();
      // var upload = _.extend(values, { progress: 0 });

      // this.model.set({
      //   upload: upload
      // });

      console.log("value changed");
    },

    _onValueChosen: function(d) {
      // Type file?
      // this.model.set({
      //   state: 'selected',
      //   upload: d
      // })
      console.log("value chosen");
    },

    _onPaneChangeSize: function() {
      this.trigger('changeSize', this);
    }

  });


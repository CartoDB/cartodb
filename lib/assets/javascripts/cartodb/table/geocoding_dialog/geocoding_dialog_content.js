
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
        title:  _t('By Street Addresses'),
        label:  _t('geocoding')
      }
    },

    _TEXTS: {
      limits: {
        key:      _t('<%= name %> key is not specified and panel can\'t be enabled'),
        account:  _t('<%= name %> data source is not available in your plan. Please upgrade'),
        credits:  _t('You\'ve reached the available <%= name %> credits for your account this month'),
        quota:    _t('Your geocoding quota is not defined, please contact us at support@cartodb.com')
      }
    },

    events: {},

    initialize: function() {
      this.countries_data = new cdb.admin.GeocodingDialog.Content.CountriesData();
      cdb.common.CreateDialog.Content.prototype.initialize.call(this, arguments);
      this.countries_data.fetch();
    },

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
      var view = new cdb.admin.GeocodingDialog.Pane.LonLat({
        table:    this.options.table
      })

      view.bind('geocodingChosen', this._onGeocodingChosen, this);

      return view;
    },

    _genCityPane: function() {
      var view = new cdb.admin.GeocodingDialog.Pane.DefaultGeocoder({
        table:          this.options.table,
        countries_data: this.countries_data,
        kind:           "namedplace",
        template:       'table/views/geocoding_dialog/geocoding_dialog_pane_city'
      });

      view.bind('geocodingChosen',  this._onGeocodingChosen, this);
      view.bind('changeSize',       this._onPaneChangeSize, this);

      return view;
    },

    _genAdminPane: function() {
      var view = new cdb.admin.GeocodingDialog.Pane.DefaultGeocoder({
        table:          this.options.table,
        countries_data: this.countries_data,
        kind:           "admin1",
        template:       'table/views/geocoding_dialog/geocoding_dialog_pane_admin'
      });

      view.bind('geocodingChosen',  this._onGeocodingChosen, this);
      view.bind('changeSize',       this._onPaneChangeSize, this);

      return view;
    },

    _genPostalPane: function() {
      var view = new cdb.admin.GeocodingDialog.Pane.DefaultGeocoder({
        table:          this.options.table,
        countries_data: this.countries_data,
        kind:           "postalcode",
        template:       'table/views/geocoding_dialog/geocoding_dialog_pane_postal'
      });

      view.bind('geocodingChosen',  this._onGeocodingChosen, this);
      view.bind('changeSize',       this._onPaneChangeSize, this);

      return view;
    },

    _genIPPane: function() {
      var view = new cdb.admin.GeocodingDialog.Pane.IP({
        table:    this.options.table
      })

      view.bind('geocodingChosen', this._onGeocodingChosen, this);

      return view;
    },

    _genAddressPane: function() {
      // Check if user can use 'address geocoder' checking his/her 
      // geocoding and quota params
      if (!this.user.get('geocoding') || this.user.get('geocoding').quota === null) {
        this._setFailedTab('address', 'quota');
        return false;
      }

      // Check if user can use geocoder checking his/her defined quotas and hart limit
      if (( this.user.get('geocoding').quota - this.user.get('geocoding').monthly_use ) <= 0 && this.user.get('geocoding').hard_limit) {
        this._setFailedTab('address', 'credits');
        return false;
      }

      var view = new cdb.admin.GeocodingDialog.Pane.Address({
        table:  this.options.table,
        user:   this.options.user  
      });

      view.bind('geocodingChosen', this._onGeocodingChosen, this);

      return view;
    },

    _genErrorPane: function() {
      return new cdb.admin.ImportErrorPane({
        model: this.model
      });
    },

    _genActionsController: function() {
      // No necessary for this geocoding dialog
    },

    _createTooltip: function(tab, type) {
      var self = this;
      var $tab = this.create_tabs.getTab(tab);

      // Tipsy?
      var tooltip = new cdb.common.TipsyTooltip({
        el: $tab,
        title: function() {
          return _.template(self._TEXTS.limits[type])({ name: ( self._TABS[tab].label || self._TABS[tab].title ) })
        }
      })
      this.addView(tooltip);
    },

    
    ////////////
    // Events //
    ////////////

    _onTabChange: function(tabName) {
      if (tabName !== "error") {
        var pane = this.create_panes.getPane(tabName);
        var geocoding = this.create_panes.getPane(tabName).getValue();

        // Set active
        pane.setActive();

        // Set model
        this.model.set({
          option: tabName,
          geocoding: geocoding
        });

        // Center dialog when tab changes
        this._onPaneChangeSize();
      }
    },

    _onStateChange: function(m, c) {
      if (this.model.get('state') === "selected") {
        var pane = this.create_panes.getPane(this.model.get('option'));
        pane.setValue(this.model.get('geocoding'));
      }
    },

    _onGeocodingChosen: function(d) {
      this.model.set('geocoding', d);
      this.trigger('geocodingChosen', this.model.attributes, this);
    },

    _onPaneChangeSize: function() {
      this.trigger('changeSize', this);
    }

  });


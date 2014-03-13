
  /**
   *  Geocoder background process
   *
   *  - It needs several models, like geocoder, table, user,...
   *
   *  new cdb.admin.BackgroundTab({
   *    model: geocoder_model,
   *    vis: vis_model,
   *    table: table_model,
   *    globalError: globalError,
   *    user: user_model
   *  })
   */

  cdb.admin.BackgroundTab = cdb.core.View.extend({

    _TEXTS: {
      geocoding_error: _t('There was a problem with our geocoder, check again later')
    },

    initialize: function() {
      this.table = this.options.table;
      this.user = this.options.user;

      this.initBinds();
      this.initViews();
      this.getGeocodifications();
    },

    initBinds: function() {
      this.model.bind('change:kind',      this._onChangeKind, this);
      this.model.bind('geocodingComplete geocodingCanceled', this.updateUser, this);
      this.model.bind('geocodingError', this._onGeocodingError, this);
    },

    initViews: function() {
      // Background geocoder
      this.bkg_geocoder = new cdb.admin.BackgroundGeocoder({
        template_base: 'table/views/geocoder_progress',
        model: this.model
      });
      this.bkg_geocoder.bindGeocoder();
      this.$el.append(this.bkg_geocoder.render().el);
      this.addView(this.bkg_geocoder);
    },

    setActiveLayer: function(layerView, layer) {
      this.model.resetGeocoding();
      this.table = layerView.table;
      // Check actual table if there is any pending geocodification.
      this.checkGeocodification();
    },

    _onChangeKind: function() {
      if (!this.model.get('id') && this.model.get('kind')) {
        this.model
          .save({
              table_name: this.table.get('id')
            },{
              wait: false,
              success: function(m) {
                m.pollCheck();
              }
            }
          );
      }
    },

    _onChangeFormatter: function() {
      if (!this.model.get('id') && this.model.get('formatter')) {
        this.model
          .save({
              table_name: this.table.get('id')
            },{
              wait: false,
              success: function(m) {
                m.pollCheck();
              }
            }
          );
      }
    },

    getGeocodifications: function() {
      if (this.geocodings) {
        this.checkGeocodification();
      } else {
        var self = this;
        var geocodings = new cdb.admin.Geocodings();
        geocodings.fetch({
          success: function(r) {
            self.geocodings = new Backbone.Collection(r.get('geocodings'));
            self.checkGeocodification();
          },
          error: function(e) {
            self.geocodings = new Backbone.Collection();
            cdb.log.info('Geocoding API is not working! -> getGeocodifications')
          }
        })
      }
    },

    checkGeocodification: function() {
      if (this.geocodings && this.table && this.table.get('id')) {
        var self = this;
        var g = this.geocodings.filter(function(m) {
          return m.get('table_name') == self.table.get('id') && m.get('state') != "finished"
        });

        if (g.length > 0) {
          var obj = g[0];
          this.model.set(obj.toJSON(), { silent: true });
          this.model.pollCheck();
        }
      }
    },

    _onGeocodingError: function() {

      this.options.globalError.showError(this._TEXTS.geocoding_error, 'error', 5000);
      this.updateUser();

    },

    // Update new user quota
    updateUser: function() {
      this.user.fetch();
    }

  });

  cdb.admin.ShareDialog = cdb.admin.BaseDialog.extend({

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{
        "click input": "_selectAll",
        "click .change-privacy": "_changePrivacy"
      });
    },

    _TEXTS: {
      title: _t('Share your map'),
      close: _t('Close'),
    },

    options: {
    },

    _KEYS: {
      _BITLY: {
        key: 'R_de188fd61320cb55d359b2fecd3dad4b',
        login: 'vizzuality'
      }
    },

    initialize: function() {

      var free_account     = (user_data.account_type.toLowerCase() == 'free');
      var paid_account     = !free_account;
      var privacy          = this.options.vis.get("privacy");
      var has_private_maps = user_data.actions.private_maps;

      var description = this.options.vis.get('description');
      var map_description = description ? markdown.toHTML(description) : "";

      this.options = _.extend({
        title: this._TEXTS.title,
        description: '',
        template_name: 'table/header/views/share_dialog',
        private_maps: user_data.actions.private_maps,
        privacy: privacy,
        clean_on_hide: true,
        ok_button_classes: "button grey",
        ok_title: this._TEXTS.close,
        width: "804px",
        modal_class: 'share_dialog',
        map_title: this.options.vis.get('name'),
        map_description: map_description,
        removable_logo: this.options.user.get("actions").remove_logo,
        touch: (!!('ontouchstart' in window) || !!('onmsgesturechange' in window)),
        upgrade_url: window.location.protocol + '//' + this.options.config.account_host + "/account/" + user_data.username + "/upgrade"
      }, this.options);

      // Bindings
      this.model = new cdb.core.Model();

      this.model.bind('change:url', this._updateURL, this);

      this._enableCopy();

      this.constructor.__super__.initialize.apply(this);
    },

    _onUpdatePasswordButtonLabel: function() {
      this.$el.find(".password .input_field .set_password").text(this.model.get("password_button_label"));
    },

    _onUpdatePasswordPlaceholder: function() {
      this.$el.find(".password .input_field input").attr("placeholder", this.model.get("password_placeholder"));
    },

    _resize: function(animated) {

      var verticalPadding = 40;
      var documentHeight = $(window).height() - verticalPadding;
      var minHeight = 635;
      var torqueWarningHeight = 40;

      this.$el.find(".block.modal:eq(0)").css({ height: documentHeight });

      var self = this;

      // returns the left and right column heights
      var calcHeights = function(baseHeight) {

        var leftColumnHeight = baseHeight - self.$el.find("h4").outerHeight(true)*2 - self.$el.find("h3").outerHeight(true) - self.$el.find(".privacy.switches").outerHeight(true) - 34; // + 13
        var mapWrapperHeight = baseHeight - 172;

        if (this.$('.torque_warning:visible').length > 0) {
          leftColumnHeight -= torqueWarningHeight;
          mapWrapperHeight -= torqueWarningHeight;
        }

        return { leftColumnHeight: leftColumnHeight, mapWrapperHeight: mapWrapperHeight };

      }

      if (documentHeight > minHeight) {
        var heights = calcHeights(documentHeight);

        if (animated == true) {
          this.$el.find(".cartodb-map_wrapper").animate({ height: heights.mapWrapperHeight }, 150);
          this.$el.find(".scrollpane").animate({ height: heights.leftColumnHeight }, 150);
        } else {
          this.$el.find(".cartodb-map_wrapper").css({ height: heights.mapWrapperHeight });
          this.$el.find(".scrollpane").css({ height: heights.leftColumnHeight });
        }
        this.$el.find(".white-gradient-shadow.bottom").css({ top: this.$el.find(".scrollpane").position().top + this.$el.find(".scrollpane").outerHeight(true) - 16 });

      } else {

        var heights = calcHeights(minHeight);

        if (animated == true) {
          this.$el.find(".cartodb-map_wrapper").animate({ height: heights.mapWrapperHeight - 3 }, 150);
          this.$el.find(".scrollpane").animate({ height: heights.leftColumnHeight }, 150);
        } else {
          this.$el.find(".cartodb-map_wrapper").css({ height: heights.mapWrapperHeight - 3 });
          this.$el.find(".scrollpane").css({ height: heights.leftColumnHeight });
        }
          this.$el.find(".white-gradient-shadow.bottom").css({ top: this.$el.find(".scrollpane").position().top + this.$el.find(".scrollpane").outerHeight(true) - 16 });


      }

      if (this.scrollPaneAPI) {
        this.scrollPaneAPI.reinitialise();
      }

    },

    _addWidget: function(widget) {
      this.addView(widget);
      this.$('.cartodb-map_wrapper').append(widget.render().$el);
    },

    _addZoomWidget: function() {

      var widget = new cdb.geo.ui.Zoom({
        model:    this.map,
        template: this.getTemplate("table/views/zoom_control")
      });

      this._addWidget(widget);

    },

    _changePrivacy: function(e) {

      e.preventDefault();
      e.stopPropagation();

      var self = this;

      this.hide(function() {
        self._openPrivacyDialog();
      });

    },

    _openPrivacyDialog: function() {

      // Check if user is the owner of the visualization
      var isOwner = this.options.vis.permission.isOwner(this.options.user);

      if (!isOwner) { return false }

      this.privacy_dialog = new cdb.admin.PrivacyDialog({
        model: this.options.vis,
        config: this.options.config,
        user: this.options.user
      });

      this.privacy_dialog.appendToBody();
      this.privacy_dialog.open({ center: true });

    },

    _addLayerWidget: function() {
      var widget = new cdb.geo.ui.LayerSelector({
        mapView: this.mapView,
        template: this.getTemplate("table/views/layer_selector"),
        dropdown_template: this.getTemplate("table/views/layer_dropdown")
      });

      widget.bind("switchChanged", this._updateSublayerOptions, this);

      this._addWidget(widget);
    },

    _addLegendWidget: function() {

      var legendWidget = new cdb.admin.mod.LegendWidget ({
        map: this.map
      });

      this._addWidget(legendWidget);

    },

    _addFullScreenWidget: function() {

      var widget = new cdb.ui.common.FullScreen({
        doc: ".cartodb-map_wrapper",
        template: this.getTemplate("table/views/fullscreen")
      });

      this._addWidget(widget);

    },

    _addShareWidget: function() {

      var shareWidget = '<div class="cartodb-share"><a href="#"></a></div>';
      this.$('.cartodb-map_wrapper').append(shareWidget);

      this._setShortURL();

      var 
      tableURL  = this.options.vis.embedURL(),
      publicURL = this.options.vis.publicURL(),
      opts      =  _.map(this.mapOptions.attributes, function(v, k) { return k + "=" + encodeURIComponent(v); }),

      opts     = opts.join('&');
      opts     = opts.replace(/'/g, "%27"); // Encode the single quotes

      var embed_url      = tableURL + "?" + opts;
      var public_map_url = publicURL + "?" + opts;

      var widget = this.shareDialogWidget = new cdb.ui.common.ShareDialog({
        model: this.map,
        className: 'cartodb-share-dialog',
        title: 'Share this map',
        disableLinks: true,
        descriptionShort: '',
        facebook_url: "#",
        twitter_url: "#",
        public_map_url: public_map_url,
        code: "<iframe width='100%' height='520' frameborder='0' src='" + embed_url + "' allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>",
        width: 432,
        template: this.getTemplate("table/views/share_dialog")
      });

      this._addWidget(widget);

    },

    _addSearchWidget: function() {

      var widget = new cdb.geo.ui.Search({
        model:    this.map,
        template: this.getTemplate("table/views/search_control")
      });

      this._addWidget(widget);
    },

    _hidePrivacySettings: function() {
      this.$("#privacy_options").hide();
    },

    _setupPrivacySettings: function() {

      var self = this;

      var opts = {}
      var privacy = this.options.vis.get("privacy");

      if (privacy !== 'PASSWORD') { // public or private vis

        this.$el.find(".privacy ." + privacy.toLowerCase() + " .radiobutton").addClass("selected");

        this.model.set({
          password_button_label: this._TEXTS.insert_password_button_label,
          password_placeholder:  this._TEXTS.insert_password_placeholder
        });

      } else { // password protected vis

        this.model.set({
          password_button_label: this._TEXTS.edit_password_button_label,
          password_placeholder:  this._TEXTS.edit_password_placeholder
        });

        this.$el.find(".privacy .password .input_field input[type='password']").val("FAKE123");

        if (user_data.actions.private_maps) {
          this.$el.find(".privacy .password .radiobutton").addClass("selected");
          this.$el.find(".privacy .password").addClass("open");
          this.$el.find(".privacy .password .input_field").show();
        }

      }

    },

    _onPrivacyRadioButtonClick: function(e) {

      e.preventDefault();
      e.stopPropagation();

      var opts = {}
      var self = this;

      var $radio = $(e.target).closest(".radiobutton");

      if (!user_data.actions.private_maps) {
        if ($radio.hasClass("disabled")) return;
      }

      this.$el.find(".radiobutton").removeClass("selected");

      $radio.addClass("selected");

      var share_mode = $radio.attr("data-mode");
      opts.privacy = share_mode.toUpperCase();

      this.$el.find(".privacy .password").removeClass("loading");

      if (share_mode != 'password') {

        this.$el.find(".password .input_field").fadeOut(250, function() {
          self.$el.find(".password").removeClass("open");
          self._resize(true);
          self._cleanPasswordField();
        });

      }

      if (share_mode == 'password') {

        this.$el.find(".password").addClass("open");
        this.$el.find(".password .input_field").fadeIn(250);
        this.$el.find(".password .input_field input").focus();

      } else {

        this.options.vis.save(opts, { success: this._onSaveSuccess, error: this._onSaveError });
        this.$el.find("." + share_mode).addClass("loading");

      }

      this._resize(true);

    },

    _cleanPasswordField: function() {

      this.$el.find("input.password").val('');

      this.model.set({
        password_button_label: this._TEXTS.insert_password_button_label,
        password_placeholder:  this._TEXTS.insert_password_placeholder
      });

    },

    _addSwitches: function(switches) {

      var self = this;

      _(switches).each(function(prop) {
        var className = '.' + prop;

        var sw = new cdb.forms.Switch({
          model: self.mapOptions,
          property: prop
        }).bind("switched", self._onSwitchSwitched);

        self.addView(sw);

        self.$("li" + className).append(sw.render().el);
        if (!self.mapOptions.attributes[prop]) self.$(className).addClass("disabled");

      });

    },

    _onSwitchSwitched: function(property, value) {
      value ? this.$el.parent().removeClass("disabled") : this.$el.parent().addClass("disabled");
    },

    _addMapView: function() {
      var self = this;

      setTimeout(function() {
        var mapViewClass = cdb.admin.LeafletMapView;

        if (self.map.get('provider') === 'googlemaps') {
          mapViewClass = cdb.admin.GoogleMapsMapView;
        }

        var el = $('<div>').addClass('cartodb-map');

        self.$('.cartodb-map_wrapper').prepend(el);

        self.mapView = new mapViewClass({
          el: el,
          map: self.map,
          user: self.options.user
        });

        self.addView(self.mapView);

        self._addLayerWidget();
        self._addLegendWidget();
        self._addFullScreenWidget();

        // trigger this change to set map bounds in the url that are get from mapView
        self.map.trigger('change');
        // Being added layer-selector and legend change preview map checking
        // if they have to be showed.
        self._changePreview();
      }, 300);

    },

    _getSublayerOptions: function() {

      var layers = this.map.layers.filter(function(lyr) {
        return _.contains(['CartoDB', 'torque'], lyr.get('type'));
      });

      return _.map(layers, function(layer) {
        return layer.get("visible");
      }).join("|").replace(/false/g, 0).replace(/true/g, 1);

    },

    _updateSublayerOptions: function() {
      var sublayer_options = this._getSublayerOptions();
      this.mapOptions.set("sublayer_options", sublayer_options);
    },

    _showTorqueWarning: function() {
      var layers = this.map.layers.getLayersByType('torque');

      if (layers.length) {
        this._resize();
        this.$('.torque_warning').fadeIn();
      }

    },

    _setPassword: function(e) {

      e && e.preventDefault();
      e && e.stopPropagation();

      var password = this.$el.find("input[type='password']").val();

      if (!cdb.Utils.isBlank(password) && password != "FAKE123") {
        this.$el.find(".password").addClass("loading");
        this.options.vis.save({ privacy: "PASSWORD", password: password }, { success: this._onSaveSuccess, error: this._onSaveError });
      }

    },

    _onSaveSuccess: function() {

      var option = this.options.vis.get("privacy");

      if (option == 'PASSWORD') {

        this.model.set({
          password_button_label: this._TEXTS.edit_password_button_label,
          password_placeholder:  this._TEXTS.edit_password_placeholder
        });

      }

      this.$el.find("." + option.toLowerCase()).removeClass("loading");


    },

    _onSaveError: function() {

      var option = this.options.vis.get("privacy");

      if (option) {
        this.$el.find("." + option.toLowerCase()).removeClass("loading");
      }

    },

    _onShareClick: function(e) {

      e.preventDefault();
      e.stopPropagation();

      this.shareDialogWidget.toggle();

    },

    _onPasswordKeyUp: function(e) {

      if (e.keyCode == '13') this._setPassword();

    },

    _onPasswordClick: function(e) {

      if (this.$el.find("input.password").val() == 'FAKE123') this.$el.find("input.password").val('');

    },

    _onInputBlur: function() {

      if (this.options.vis.attributes.privacy == 'PASSWORD' && this.$el.find("input.password").val() == '' && this.model.get("password_placeholder") === this._TEXTS.edit_password_placeholder) {
        this.$el.find("input.password").val('FAKE123');
      }

    },

    _onInputClick: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var $input =  $(e.target).find("input")[0] ? $(e.target).find("input") : $(e.target)

      $input.select();

    },

    _onMethodClick: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var $link  = $(e.target);
      var method = $link.attr("data-method");

      this.model.set("method", method);
    },

    _updateURL: function(obj, url) {

      if (url === "") {
        this.$el.find("li.link .input_field").addClass('loading');
      } else {
        this.$el.find("li.link .input_field").removeClass('loading');
      }

      this.$el.find("li.link input").val(url);

    },

    /*
     * Enables copy functionality.
     */
    _enableCopy: function(active) {
      var self = this;

      setTimeout(function() { // Hack for ZeroClipboard, it doesn't like effects :S
        self.$el.find("a.copy").zclip({
          path: cdb.config.get('assets_url') + "/flash/ZeroClipboard.swf",
          copy: function(){

            $(".tipsy .tipsy-inner").css("width", $(".tipsy .tipsy-inner").width());
            $(".tipsy .tipsy-inner").text("Copied!");
            $(".tipsy").delay(550).fadeOut(250);
            return $(this).parent().find("input").val();

          }
        })
      }, 500);

      // Tipsy tooltip ready!
      this.$el.find(".zclip")
      .tipsy({
        gravity: 's',
        live: true,
        fade: true,
        title: function() {
          return _t("Copy this");
        }
      });

      // Prevent url hash error
      this.$el.find("a.tooltip").click(function(ev) {
        ev.preventDefault();
      });
    },

    _selectAll: function(e) {
      $(e.target).select();
    },

    _setLinkURL: function() {

      var self = this;

      if (!this.localStorage) this.localStorage = new cdb.admin.localStorage('cartodb_urls');

      var
      tableUrl = this.options.vis.publicURL();
      var url = tableUrl;

      // If we already have retrieved this url, set it. if not, fetch from bitly
      var storedShortURL = this.localStorage.search(url);

      if (storedShortURL) {
        this.model.set("url", storedShortURL);
      } else {
        this._requestShortURL(url);
      }

    },

    _requestShortURL: function(url) {
      var self = this;

      this.model.set("url", '');

      $.ajax({
        url:"https://api-ssl.bitly.com/v3/shorten?longUrl=" + encodeURIComponent(url)+ "&login=" + this._KEYS._BITLY.login + "&apiKey=" + this._KEYS._BITLY.key,
        type:"GET",
        async: false,
        dataType: 'jsonp',
        success:  function(res) {
          self._onRequestShortURLSuccess(res, url);
        },
        error: function(e) {
          self._onRequestShortURLError(url);
        }
      });
    },

    _onRequestShortURLSuccess: function(res, url) {
        if(res.status_code && res.status_code == "200") {
          var obj = {};
          obj[url] = 'http://cdb.io/'+ res.data.hash;

          this.$el.find("li.link input").val(obj[url]);

          this.localStorage.add(obj);
          this.model.set("url", obj[url]);
        } else {
          this.model.set("url", url);
        }
    },

    _onRequestShortURLError: function(url) {
      this.model.set("url", url);
    },

    _setIframeURL: function() {

      var embed_url = this.options.vis.embedURL();

      var iframe     = "<iframe width='100%' height='520' frameborder='0' src='" + embed_url + "' allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>";

      this.$el.find(".embed input").val(iframe);
      this.$el.find(".simple_url").attr("href", embed_url);
      this.$el.find(".simple_url").attr("target", "_blank");

    },

    _setAPIURL: function() {
      this.$el.find(".api input").val(this.options.vis.vizjsonURL());
    },

    render_content: function() {

      this._setLinkURL();
      this._setIframeURL();
      this._setAPIURL();

      // Event tracking payload
      var d = {
        account_type: this.options.user.get('account_type'),
        privacy:      this.options.vis.get("privacy")
      };

      if (this.options.user.isInsideOrg()) {
        d.enterprise_org = this.options.user.organization.get('name');
      }

      // TODO: remove mixpanel
      cdb.god.trigger('mixpanel', 'Click Publish Visualization', d);
      cdb.god.trigger('mixpanel_people', {'publish_visualization_last_clicked': new Date()});

      // Event tracking "Published visualization"
      cdb.god.trigger('metrics', 'published_visualization', {
        email: window.user_data.email
      });

      return this;

    },

    open: function(options) {
      var self = this;

      this.trigger("will_open", this);

      this.$(".modal").css({
        "opacity": "0",
        "marginTop": "120px"
      });

      this.$(".mamufas").fadeIn();
      this.$(".modal").animate({
        marginTop: "90px",
        opacity: 1
      }, 300);
    }

  });

  cdb.admin.ShareDialog = cdb.admin.BaseDialog.extend({

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{
        "click input": "_selectAll"
      });
    },

    _TEXTS: {
      title: _t('Share your visualization'),
      close: _t('Close'),
    },

    options: {
      vizjson_url: 'http://<%= host %>/api/v2/viz/<%= id %>/viz.json'
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

      //_.bindAll(this, "_resize", "_onPrivacyRadioButtonClick", "_onSaveSuccess", "_onSaveError");

      // Bindings
      this.model = new cdb.core.Model();

      this.model.bind('change:url', this._updateURL, this);

      this._enableCopy();

      this.constructor.__super__.initialize.apply(this);
    },

    _updateURL: function(obj, url) {

      /*if (url === "") {
        $url.addClass('loading');
      } else {
        $url.removeClass('loading');
      }
*/
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
      tableUrl = this.options.vis.publicURL(),
      origin   = "http://" + location.host; // share urls are always HTTP

      var url = origin + tableUrl;

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

          this.$el.find(".link input").val(obj[url]);

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

      var
      tableURL  = this.options.vis.embedURL(),
      origin    = "http://" + location.host; // share urls are always HTTP

      var embed_url  = origin + tableURL;
      var iframe     = "<iframe width='100%' height='520' frameborder='0' src='" + embed_url + "' allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>";

      this.$el.find(".embed input").val(iframe);

    },

    _setAPIURL: function() {
      var opts = { host: location.host, id: this.options.vis.get('id') };
      var url = _.template(this.options.vizjson_url)(opts);
      this.$el.find(".api input").val(url);
    },

    render_content: function() {

      this._setIframeURL();
      this._setLinkURL();
      this._setAPIURL();

      return this;

    },

    open: function(options) {
      var self = this;

      this.trigger("will_open", this);

      this.$el.find(".modal:eq(0)").css({
        "opacity": "0"
        //"marginTop": "170px"
      });

      this.$el.find(".mamufas:eq(0)").fadeIn();

      if (options && options.center) {

        this.$el.find(".modal:eq(0)").css({
          top: 100
        });

        this.$el.find(".modal:eq(0)").animate({ opacity: 1 }, 300);

      } else {

        this.$el.find(".modal:eq(0)").animate({
          marginTop: "120px",
          opacity: 1
        }, 300);
      }
    }

  });

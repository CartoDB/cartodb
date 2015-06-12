
  /**
   *  WMS pane for import a file
   */

  cdb.admin.WMSService = Backbone.Model.extend({

    _PROXY_URL:   '//cartodb-wms.global.ssl.fastly.net/api',
    _PROXY_TILES: '//cartodb-wms.global.ssl.fastly.net/mapproxy',

    methodToURL: {
      'read':   '/check',
      'create': '/add'
    },

    sync: function(method, model, options) {
      options = options || {};
      options.url = this.url(method.toLowerCase());
      options.dataType = 'jsonp';
      method = "READ";
      return Backbone.sync.apply(this, arguments);
    },

    url: function(method) {
      var req = this._PROXY_URL + this.methodToURL[method];
      var url = this.get('wms_url');

      var parser = document.createElement('a');

      parser.href = url;

      var params = parser.search.substr(1).split("&");

      var hasCapabilities = _.find(params, function(p) { return p.toLowerCase().indexOf("request=getcapabilities") !== -1; });
      var hasService      = _.find(params, function(p) { return p.toLowerCase().indexOf("service=wms") !== -1; });

      // If the user didn't provided the necessary params, let's add them

      if (!hasCapabilities) {
        params.push("request=GetCapabilities");
      }

      if (!hasService) {
        params.push("service=WMS");
      }

      url += "?" + params.join("&");
      req += '?url=' + encodeURIComponent(url);

      var isWMTS = this.get('type') === 'wmts';
      req += '&type=' + (isWMTS ? 'wmts' : 'wms');

      if (method === 'create') {
        if (this.get('layer') && this.get('srs')) {
          req += "&layer=" + this.get('layer');
          req += "&srs=EPSG:" + this.get('srs')[0].split(':')[1];
        } else if (isWMTS && this.get('layer') && this.get('matrix_sets').length > 0) {
          req += '&layer=' + this.get('layer');
          req += '&matrix_set=' + cdb.admin.WMSService.supportedMatrixSets(this.get('matrix_sets' || []))[0];
        }
      }

      return req;
    },

    newTileLayer: function() {
      if (!this.get('mapproxy_id')) {
        throw new Error('mapproxy_id must be set');
      }
      return new cdb.admin.TileLayer({
        urlTemplate: this._PROXY_TILES + '/' + this.get('mapproxy_id') + '/wmts/map/webmercator/{z}/{x}/{y}.png',
        attribution: this.get('attribution') || null,
        maxZoom: 21,
        minZoom: 0,
        name: this.get('title') || this.get('name'),
        proxy: true,
        bounding_boxes: this.get('bounding_boxes')
      });
    }

  }, {

    SUPPORTED_MATRIX_SETS: [
      'EPSG:4326',
      'EPSG:4258'
    ],

    /**
     * Unfortunately the WMS proxy do not support all matrix sets for a WMTS kind of resource, so filter out the ones
     * that are actually supported for now.
     * @return {Array}
     */
    supportedMatrixSets: function(matrixSets) {
      // matrixSets = matrixSets || [];
      return _.intersection(matrixSets, this.SUPPORTED_MATRIX_SETS);
    }
  });

  cdb.admin.WMSBasemapChooserPane = cdb.admin.BasemapChooserPane.extend({

    _TEXTS: {
      error:        _t('Your WMS base URL is not valid or doesn\'t contain \
                      any layer with supported projections (3857, 900913).'),
      placeholder:  _t('Insert your WMS base URL')
    },

    className: "basemap-pane",

    events: {
      'focusin input[type="text"]' : "_focusIn",
      'focusout input[type="text"]': "_focusOut",
      'keyup input[type="text"]'   : "_onInputChange",
      'paste input[type="text"]'   : "_onInputPaste"
    },

    initialize: function() {
      _.bindAll(this, "_onSuccess", "_errorChooser", "_onInputChange", "checkTileJson");

      this.template = this.options.template || cdb.templates.getTemplate('table/views/basemap/basemap_chooser_pane');
      this.render();
    },

    render: function() {
      this.$el.html(this.template({
        placeholder:  this._TEXTS.placeholder,
        error:        this._TEXTS.error
      }));
      return this;
    },

    // If url input change, hide uploader
    _onInputPaste: function(e) {
      // Hack necessary to get input value after a paste event
      // Paste event is fired before text is applied / added to the input
      setTimeout(this._onInputChange,100);
    },

    _onInputChange: function(e) {
      var $el = this.$("input[type='text']")
        , val = $el.val();

      // If form is submitted, go out!
      if (e && e.keyCode == 13) {
        return false;
      }

      if (val == "") {
        this._hideLoader();
        this._hideError();
        this.trigger('inputChange', '', this);
      } else {
        this.trigger('inputChange', val, this);
      }
    },

    /**
     * Hide loader
     */
    _hideLoader: function() {
      this.$el.find("div.loader").hide();
    },

    /**
     * Show loader
     */
    _showLoader: function() {
      this.$el.find("div.loader").show();
    },

    _hideError: function() {
      this.$el.find("input").removeClass("error");
      this.$("div.info").removeClass("error active")
    },

    _showError: function() {
      this.$el.find("input").addClass("error");
      this.$el.find("div.info").addClass("error active");
    },

    /**
     * return a https url if the current application is loaded from https
     */
    _fixHTTPS: function(url, loc) {
      loc = loc || location;

      // fix the url to https or http
      if (url.indexOf('https') !== 0 && loc.protocol === 'https:') {
        // search for mapping
        return url.replace(/http/, 'https');
      }
      return url;
    },

    /**
     * Style box when user focuses in/out over the input
     */

    _focusIn: function(ev) {
      $(ev.target)
        .closest('div.input')
        .addClass('active')
    },

    _focusOut: function(ev) {
      $(ev.target)
        .closest('div.input')
        .removeClass('active')
    },

    _lowerXYZ: function(url) {
      return url.replace(/\{S\}/g, "{s}")
        .replace(/\{X\}/g, "{x}")
        .replace(/\{Y\}/g, "{y}")
        .replace(/\{Z\}/g, "{z}");
    },

    _addHTTP: function(url) {

      // fix the url to https or http
      if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
        return "http://" + url;
      }

      return url;
    },

    /**
     * this function checks that the url is correct and returns a valid JSON
     * https://github.com/Vizzuality/cartodb-management/wiki/WMS-JSON-format
     */
    checkTileJson: function(val) {
      this._hideError();
      this._showLoader();

      var url = this._addHTTP(val);

      if (cdb.Utils.isBlank(val) || url === "http://") {
        this._errorChooser();
        return;
      }

      var self = this;

      w = new cdb.admin.WMSService({ wms_url: url });

      w.bind('change:layers', function() {
        self.trigger('chooseWMSLayers', w);
      });

      w.fetch({ success: this._onSuccess, error: this._errorChooser });
    },

    _onSuccess: function(model, response) {
      if (response && response.error) {
        this._errorChooser();
        return;
      }

      var layers = model.get("layers");

      if (layers.length == 0) {
        this._errorChooser();
      }
    },

    /**
     * If the url is not valid
     */
    _errorChooser: function(e) {

      var $input = this.$el.find("input");

      // End loader
      this._hideLoader();

      // Show error
      this._showError();

      // Enable input
      $input.attr("disabled");

      // Enable dialog? nop!
      this.trigger('errorChooser');
    }
  });

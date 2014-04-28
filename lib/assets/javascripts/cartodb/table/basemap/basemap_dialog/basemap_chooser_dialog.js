
  /**
   * Shows a dialog to choose another base map
   *
   * new BaseMapChooser()
   *
   */

  cdb.admin.BaseMapAdder = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:  _t("Add your basemap"),
      description: _t("Add your XYZ, WMS, NASA or MapBox maps"),
      ok:     _t("Add basemap")
    },

    _WAITING_INPUT_TIME: 1000,

    events: function(){
      return _.extend({}, cdb.admin.BaseDialog.prototype.events);
    },

    initialize: function() {
      _.bindAll(this, "_successChooser", "_errorChooser", "_checkOKButton");

      _.extend(this.options, {
        title: this._TEXTS.title,
        description: this._TEXTS.description,
        clean_on_hide: true,
        cancel_button_classes: "margin15",
        ok_button_classes: "button grey",
        ok_title: this._TEXTS.ok,
        modal_type: "compressed",
        width: 512,
        modal_class: 'basemap_chooser_dialog',
      });

      this.constructor.__super__.initialize.apply(this);

      this.model = new cdb.core.Model({ enabled: true, url:'' });
    },

    render_content: function() {
      var $content = this.$content = $("<div>");
      this.temp_content = cdb.templates.getTemplate('table/views/basemap/basemap_chooser_dialog');
      $content.append(this.temp_content());

      // Render file tabs
      this.render_basemap_tabs($content);

      return $content;
    },

    render_basemap_tabs: function($content) {
      // Basemap tabs
      this.basemap_tabs = new cdb.admin.Tabs({
        el: $content.find('.basemap-tabs'),
        slash: true
      });
      this.addView(this.basemap_tabs);

      // MapBox
      this.mapboxPane = new cdb.admin.MapboxBasemapChooserPane({
        layer_ids: this.options.layer_ids
      });
      this.mapboxPane.bind('successChooser', this._successChooser, this);
      this.mapboxPane.bind('errorChooser', this._errorChooser);
      this.mapboxPane.bind('inputChange', this._checkOKButton);

      // ZXY
      this.zxyPane = new cdb.admin.ZXYBasemapChooserPane({
        layer_ids: this.options.layer_ids
      });
      this.zxyPane.bind('successChooser', this._successChooser, this);
      this.zxyPane.bind('errorChooser', this._errorChooser);
      this.zxyPane.bind('inputChange', this._checkOKButton);

      // NASA
      this.nasaPane = new cdb.admin.NASABasemapChooserPane({
        layer_ids: this.options.layer_ids
      });
      this.nasaPane.bind('successChooser',  this._successChooser, this);
      this.nasaPane.bind('errorChooser',    this._errorChooser);
      this.nasaPane.bind('inputChange',     this._checkOKButton);
      

      // WMS
      this.wmsPane = new cdb.admin.WMSBasemapChooserPane({
        layer_ids: this.options.layer_ids
      });
      this.wmsPane.bind('chooseWMSLayers', this._chooseWMSLayers, this);
      this.wmsPane.bind('errorChooser', this._errorChooser);
      this.wmsPane.bind('inputChange', this._checkOKButton);

      // Create TabPane
      this.basemap_panes = new cdb.ui.common.TabPane({
        el: $content.find(".basemap-panes")
      });
      this.basemap_panes.addTab('mapbox', this.mapboxPane);
      this.basemap_panes.addTab('xyz',    this.zxyPane);
      this.basemap_panes.addTab('wms',    this.wmsPane);
      this.basemap_panes.addTab('nasa',   this.nasaPane);
      this.basemap_panes.bind('tabEnabled', this._checkOKButton, this);

      this.basemap_tabs.linkToPanel(this.basemap_panes);
      this.addView(this.basemap_panes);
      $content.append(this.basemap_panes.render());

      this.basemap_panes.active('xyz');
    },

    //////////////
    //   HELP   //
    //////////////
    getURL: function() {
      return this.basemap_panes.activePane.$el.find("input[type='text']").val();
    },

    //////////////
    //   UI     //
    //////////////

    // Check
    _checkOKButton: function() {
      var $ok = this.$("a.ok");
      var action = 'addClass';

      var url = this.getURL();

      if (url) {
        action = 'removeClass';
      } else {
        action = 'addClass';
      }

      $ok
        [action]('disabled')
    },

    _reloadWMSPane: function() {
      //this.removeView(this.basemap_tabs);
      this.removeView(this.basemap_panes);
      this.$el.find(".content").html(this.render_content());
      this.basemap_panes.active("wms");
      this.centerInScreen(true);

      this._enableCancel();

    },

    _chooseWMSLayers: function(data) {

      var server = data.get("wms_url").replace(/\?.*/,'');
      var layers = data.get("layers");

      if (layers.length == 0) {
        this._errorChooser();
        return;
      }

      this.basemap_panes.activePane._hideLoader();

      this.basemap_panes.removeTab('wms');
      this.wmsNewPane = new cdb.admin.WMSBasemapLayersPane({ url: server, format: data.get("format"), layers: data.get('layers') });
      this.wmsNewPane.bind('successChooser', this._successWMSChooser, this);
      this.wmsNewPane.bind('reloadWMSPane', this._reloadWMSPane, this);
      this.wmsNewPane.bind('enableBack', this._enableBack, this);

      this.basemap_panes.addTab('wms', this.wmsNewPane);

      this.$el.find(".scrollpane").jScrollPane({ showArrows: true });

      this.model.set("enabled", true);
      this.centerInScreen(true);

    },

    _enableCancel: function(e) {

      var self = this;

      this.$el.find(".cancel").off("click");
      this.$el.find(".cancel").text("Cancel");
      this.$el.find(".cancel").on("click", function(e) {
        e.preventDefault(e);
        e.stopPropagation(e);
        self._cancel();
      });

    },

    _enableBack: function() {

      var self  = this;

      this.$el.find(".cancel").text("Back");
      this.$el.find(".cancel").off("click");
      this.$el.find(".cancel").on("click", function(e) {
        e.preventDefault(e);
        e.stopPropagation(e);
        self._reloadWMSPane();
      });

    },

    _updateBoundingBox: function(data) {

      var bboxes = data.get("bounding_boxes");

      if (bboxes && bboxes.length > 0) {

        var bbox;

        _.each(bboxes, function(box) {
          var projection = box.srs || box.crs;

          var is3857   = projection.indexOf("3857") != -1;
          var is900913 = projection.indexOf("900913") != -1;

          if (!bbox && ( is3857 || is900913 )) {
            bbox =  { bounding_box: box, projection: projection.replace(/epsg:/gi, "") };
          }

        });

        if (bbox && bbox.bounding_box) {
          this._calculateBounds(bbox.bounding_box, bbox.projection, this._setBounds);
        }

      }

    },

    _calculateBounds: function(bounding_box, projection, callback) {

      var minx = bounding_box.minx;
      var miny = bounding_box.miny;
      var maxx = bounding_box.maxx;
      var maxy = bounding_box.maxy;

      var sql = "WITH bbox as (SELECT (ST_Transform(ST_MakeEnvelope(" + minx + ", " + miny + ", " + maxx + ", " + maxy + ", (SELECT srid FROM spatial_ref_sys WHERE auth_srid = " + projection + ")), 4326)) as bbox_t) SELECT ST_XMin(bbox_t) as xmin, ST_YMin(bbox_t) as ymin, ST_XMax(bbox_t) as xmax, ST_YMax(bbox_t) as ymax FROM bbox";

      var sqlApi = cdb.admin.SQL();
      sqlApi.execute(sql).done(function(data) {
        bbox = data.rows[0];
        callback && callback(bbox, projection);
      })

    },

    _setBounds: function(bounding_box, projection) {

      if (!bounding_box) return;

      this.table.map.setBounds([
        [bounding_box.ymin, bounding_box.xmin],
        [bounding_box.ymax, bounding_box.xmax]
      ]);

    },

    _successWMSChooser: function(data) {

      this._updateBoundingBox(data);

      // End loader
      // this.basemap_panes.activePane._hideLoader();

      var layer = new cdb.admin.WMSLayer({
        urlTemplate: data.get("urlTemplate"),
        name: data.get("name"),
        bouding_boxes: data.get("bounding_boxes"),
        layers: data.get("layers"),
        type: "wms",
        transparent: true,
        format: data.get("format")
      });

      //Set the className from the urlTemplate of the basemap
      var name = data.get("className");
      layer.set("className", layer._generateClassName(name.toLowerCase()));

      // do not save before add because the layer collection
      // has the correct url
      this.options.baseLayers.add(layer);

      layer.save();

      // Remove error
      //this.basemap_panes.activePane._hideError();

      this.hide();
      this.options.ok && this.options.ok(layer);
    },

    /**
     * If the url is valid
     */
    _successChooser: function(layer, name) {
      // End loader
      this.basemap_panes.activePane._hideLoader();

      // Set the className from the urlTemplate of the basemap
      layer.set("className", layer._generateClassName(name));

      // do not save before add because the layer collection
      // has the correct url
      this.options.baseLayers.add(layer);
      layer.save();

      // Remove error
      this.basemap_panes.activePane._hideError();

      this.hide();
      this.options.ok && this.options.ok(layer);
    },

    _errorChooser: function() {
      this.model.set("enabled", true);
    },

    _ok: function(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();

      var val = this.basemap_panes.activePane.$el.find("input[type='text']").val();

      if (this.model.get("enabled")) {
        this.model.set("enabled", false);

        this.basemap_panes.activePane.checkTileJson(val);
      }
    }
  });


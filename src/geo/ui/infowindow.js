/** Usage:
 *
 * Add Infowindow model:
 *
 * var infowindowModel = new cdb.geo.ui.InfowindowModel({
 *   template_name: 'infowindow_light',
 *   latlng: [72, -45],
 *   offset: [100, 10]
 * });
 *
 * var infowindow = new cdb.geo.ui.Infowindow({
 *   model: infowindowModel,
 *   mapView: mapView
 * });
 *
 * Show the infowindow:
 * infowindow.showInfowindow();
 *
 */

cdb.geo.ui.InfowindowModel = Backbone.Model.extend({

  SYSTEM_COLUMNS: ['the_geom', 'the_geom_webmercator', 'created_at', 'updated_at', 'cartodb_id', 'cartodb_georef_status'],

  defaults: {
    template_name: 'infowindow_light',
    latlng: [0, 0],
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    maxHeight: 180, // max height of the content, not the whole infowindow
    autoPan: true,
    template: "",
    content: "",
    visibility: false,
    alternative_names: { },
    fields: null // contains the fields displayed in the infowindow
  },

  clearFields: function() {
    this.set({fields: []});
  },

  saveFields: function(where) {
    where = where || 'old_fields';
    this.set(where, _.clone(this.get('fields')));
  },

  fieldCount: function() {
    var fields = this.get('fields')
    if (!fields) return 0;
    return fields.length
  },

  restoreFields: function(whiteList, from) {
    from = from || 'old_fields';
    var fields = this.get(from);
    if(whiteList) {
      fields = fields.filter(function(f) {
        return _.contains(whiteList, f.name);
      });
    }
    if(fields && fields.length) {
      this._setFields(fields);
    }
    this.unset(from);
  },

  _cloneFields: function() {
    return _(this.get('fields')).map(function(v) {
      return _.clone(v);
    });
  },

  _setFields: function(f) {
    f.sort(function(a, b) { return a.position -  b.position; });
    this.set({'fields': f});
  },

  sortFields: function() {
    this.get('fields').sort(function(a, b) { return a.position - b.position; });
  },

  _addField: function(fieldName, at) {
    var dfd = $.Deferred();
    if(!this.containsField(fieldName)) {
      var fields = this.get('fields');
      if(fields) {
        at = at === undefined ? fields.length: at;
        fields.push({ name: fieldName, title: true, position: at });
      } else {
        at = at === undefined ? 0 : at;
        this.set('fields', [{ name: fieldName, title: true, position: at }], { silent: true});
      }
    }
    dfd.resolve();
    return dfd.promise();
  },

  addField: function(fieldName, at) {
    var self = this;
    $.when(this._addField(fieldName, at)).then(function() {
      self.sortFields();
      self.trigger('change:fields');
      self.trigger('add:fields');
    });
    return this;
  },

  getFieldProperty: function(fieldName, k) {
    if(this.containsField(fieldName)) {
      var fields = this.get('fields') || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      return fields[idx][k];
    }
    return null;
  },

  setFieldProperty: function(fieldName, k, v) {
    if(this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      fields[idx][k] = v;
      this._setFields(fields);
    }
    return this;
  },

  getAlternativeName: function(fieldName) {
    return this.get("alternative_names") && this.get("alternative_names")[fieldName];
  },

  setAlternativeName: function(fieldName, alternativeName) {
    var alternativeNames = this.get("alternative_names") || [];

    alternativeNames[fieldName] = alternativeName;
    this.set({ 'alternative_names': alternativeNames });
    this.trigger('change:alternative_names');
  },

  getFieldPos: function(fieldName) {
    var p = this.getFieldProperty(fieldName, 'position');
    if(p == undefined) {
      return Number.MAX_VALUE;
    }
    return p;
  },

  containsAlternativeName: function(fieldName) {
    var names = this.get('alternative_names') || [];
    return names[fieldName];
  },

  containsField: function(fieldName) {
    var fields = this.get('fields') || [];
    return _.contains(_(fields).pluck('name'), fieldName);
  },

  removeField: function(fieldName) {
    if(this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      if(idx >= 0) {
        fields.splice(idx, 1);
      }
      this._setFields(fields);
      this.trigger('remove:fields')
    }
    return this;
  },

  // updates content with attributes
  updateContent: function(attributes) {
    var fields = this.get('fields');
    this.set('content', cdb.geo.ui.InfowindowModel.contentForFields(attributes, fields));
  },

  closeInfowindow: function(){
  if (this.get('visibility')) {
      this.set("visibility", false);
      this.trigger('close');
    }
  }

}, {
  contentForFields: function(attributes, fields, options) {
    options = options || {};
    var render_fields = [];
    for(var j = 0; j < fields.length; ++j) {
      var field = fields[j];
      var value = attributes[field.name];
      if(options.empty_fields || (value !== undefined && value !== null)) {
        render_fields.push({
          title: field.title ? field.name : null,
          value: attributes[field.name],
          index: j
        });
      }
    }

    // manage when there is no data to render
    if (render_fields.length === 0) {
      render_fields.push({
        title: null,
        value: 'No data available',
        index: 0,
        type: 'empty'
      });
    }

    return {
      fields: render_fields,
      data: attributes
    };
  }
});

cdb.geo.ui.Infowindow = cdb.core.View.extend({
  className: "cartodb-infowindow",

  spin_options: {
    lines: 10, length: 0, width: 4, radius: 6, corners: 1, rotate: 0, color: 'rgba(0,0,0,0.5)',
    speed: 1, trail: 60, shadow: false, hwaccel: true, className: 'spinner', zIndex: 2e9,
    top: 'auto', left: 'auto', position: 'absolute'
  },

  events: {
    // Close bindings
    "click .close":         "_closeInfowindow",
    "touchstart .close":    "_closeInfowindow",
    "MSPointerDown .close": "_closeInfowindow",
    // Rest infowindow bindings
    "dragstart":            "_checkOrigin",
    "mousedown":            "_checkOrigin",
    "touchstart":           "_checkOrigin",
    "MSPointerDown":        "_checkOrigin",
    "dblclick":             "_stopPropagation",
    "DOMMouseScroll":       "_stopBubbling",
    'MozMousePixelScroll':  "_stopBubbling",
    "mousewheel":           "_stopBubbling",
    "dbclick":              "_stopPropagation",
    "click":                "_stopPropagation"
  },

  initialize: function(){
    var self = this;

    _.bindAll(this, "render", "setLatLng", "_setTemplate", "_updatePosition",
      "_update", "toggle", "show", "hide");

    this.mapView = this.options.mapView;

    // Set template if it is defined in options
    if (this.options.template) this.model.set('template', this.options.template);

    // Set template view variable and
    // compile it if it is necessary
    if (this.model.get('template')) {
      this._compileTemplate();
    } else {
      this._setTemplate();
    }

    this.model.bind('change:content',             this.render, this);
    this.model.bind('change:template_name',       this._setTemplate, this);
    this.model.bind('change:latlng',              this._update, this);
    this.model.bind('change:visibility',          this.toggle, this);
    this.model.bind('change:template',            this._compileTemplate, this);
    this.model.bind('change:sanitizeTemplate',    this._compileTemplate, this);
    this.model.bind('change:alternative_names',   this.render, this);
    this.model.bind('change:width',               this.render, this);
    this.model.bind('change:maxHeight',           this.render, this);

    this.mapView.map.bind('change',             this._updatePosition, this);

    this.mapView.bind('zoomstart', function(){
      self.hide(true);
    });

    this.mapView.bind('zoomend', function() {
      self.show(true);
    });

    this.add_related_model(this.mapView.map);

    // Hide the element
    this.$el.hide();
  },


  /**
   *  Render infowindow content
   */
  render: function() {

    if(this.template) {

      // If there is content, destroy the jscrollpane first, then remove the content.
      var $jscrollpane = this.$(".cartodb-popup-content");
      if ($jscrollpane.length > 0 && $jscrollpane.data() != null) {
        $jscrollpane.data().jsp && $jscrollpane.data().jsp.destroy();
      }

      // Clone fields and template name
      var fields = _.map(this.model.attributes.content.fields, function(field){
        return _.clone(field);
      });
      var data = this.model.get('content') ? this.model.get('content').data : {};

      // If a custom template is not applied, let's sanitized
      // fields for the template rendering
      if (this.model.get('template_name')) {
        var template_name = _.clone(this.model.attributes.template_name);

        // Sanitized them
        fields = this._fieldsToString(fields, template_name);
      }

      // Join plan fields values with content to work with
      // custom infowindows and CartoDB infowindows.
      var values = {};
      _.each(this.model.get('content').fields, function(pair) {
        values[pair.title] = pair.value;
      })

      var obj = _.extend({
          content: {
            fields: fields,
            data: data
          }
        },values);

      this.$el.html(
        cdb.core.sanitize.html(this.template(obj), this.model.get('sanitizeTemplate'))
      );

      // Set width and max-height from the model only
      // If there is no width set, we don't force our infowindow
      if (this.model.get('width')) {
        this.$('.cartodb-popup').css('width', this.model.get('width') + 'px');
      }
      this.$('.cartodb-popup .cartodb-popup-content').css('max-height', this.model.get('maxHeight') + 'px');

      // Hello jscrollpane hacks!
      // It needs some time to initialize, if not it doesn't render properly the fields
      // Check the height of the content + the header if exists
      var self = this;
      setTimeout(function() {
        var actual_height = self.$(".cartodb-popup-content").outerHeight();
        if (self.model.get('maxHeight') <= actual_height)
          self.$(".cartodb-popup-content").jScrollPane({
            maintainPosition:       false,
            verticalDragMinHeight:  20
          });
      }, 1);

      // If the infowindow is loading, show spin
      this._checkLoading();

      // If the template is 'cover-enabled', load the cover
      this._loadCover();

      if(!this.isLoadingData()) {
        this.model.trigger('domready', this, this.$el);
        this.trigger('domready', this, this.$el);
      }
    }

    return this;
  },

  _getModelTemplate: function() {
    return this.model.get("template_name")
  },

  /**
   *  Change template of the infowindow
   */
  _setTemplate: function() {
    if (this.model.get('template_name')) {
      this.template = cdb.templates.getTemplate(this._getModelTemplate());
      this.render();
    }
  },

  /**
   *  Compile template of the infowindow
   */
  _compileTemplate: function() {
    var template = this.model.get('template') ?
      this.model.get('template') :
      cdb.templates.getTemplate(this._getModelTemplate());

    if(typeof(template) !== 'function') {
      this.template = new cdb.core.Template({
        template: template,
        type: this.model.get('template_type') || 'mustache'
      }).asFunction()
    } else {
      this.template = template
    }

    this.render();
  },

  /**
   *  Check event origin
   */
  _checkOrigin: function(ev) {
    // If the mouse down come from jspVerticalBar
    // dont stop the propagation, but if the event
    // is a touchstart, stop the propagation
    var come_from_scroll = (($(ev.target).closest(".jspVerticalBar").length > 0) && (ev.type != "touchstart"));

    if (!come_from_scroll) {
      ev.stopPropagation();
    }
  },

  /**
   *  Convert values to string unless value is NULL
   */
  _fieldsToString: function(fields, template_name) {
    var fields_sanitized = [];
    if (fields && fields.length > 0) {
      var self = this;
      fields_sanitized = _.map(fields, function(field,i) {
        // Return whole attribute sanitized
        return self._sanitizeField(field, template_name, field.index || i);
      });
    }
    return fields_sanitized;
  },

  /**
   *  Sanitize fields, what does it mean?
   *  - If value is null, transform to string
   *  - If value is an url, add it as an attribute
   *  - Cut off title if it is very long (in header or image templates).
   *  - If the value is a valid url, let's make it a link.
   *  - More to come...
   */
  _sanitizeField: function(attr, template_name, pos) {
    // Check null or undefined :| and set both to empty == ''
    if (attr.value == null || attr.value == undefined) {
      attr.value = '';
    }

    //Get the alternative title
    var alternative_name = this.model.getAlternativeName(attr.title);

    if (attr.title && alternative_name) {
      // Alternative title
      attr.title = alternative_name;
    } else if (attr.title) {
      // Remove '_' character from titles
      attr.title = attr.title.replace(/_/g,' ');
    }

    // Cast all values to string due to problems with Mustache 0 number rendering
    var new_value = attr.value.toString();

    // If it is index 0, not any field type, header template type and length bigger than 30... cut off the text!
    if (!attr.type && pos==0 && attr.value.length > 35 && template_name && template_name.search('_header_') != -1) {
      new_value = attr.value.substr(0,32) + "...";
    }

    // If it is index 1, not any field type, header image template type and length bigger than 30... cut off the text!
    if (!attr.type && pos==1 && attr.value.length > 35 && template_name && template_name.search('_header_with_image') != -1) {
      new_value = attr.value.substr(0,32) + "...";
    }

    // Is it the value a link?
    if (this._isValidURL(attr.value)) {
      new_value = "<a href='" + attr.value + "' target='_blank'>" + new_value + "</a>"
    }

    // If it is index 0, not any field type, header image template type... don't cut off the text or add any link!!
    if (pos==0 && template_name.search('_header_with_image') != -1) {
      new_value = attr.value;
    }

    // Save new sanitized value
    attr.value = new_value;

    return attr;
  },

  isLoadingData: function() {
    var content = this.model.get("content");
    return content.fields && content.fields.length == 1 && content.fields[0].type === "loading";
  },

  /**
   *  Check if infowindow is loading the row content
   */
  _checkLoading: function() {
    if (this.isLoadingData()) {
      this._startSpinner();
    } else {
      this._stopSpinner();
    }
  },

  /**
   *  Stop loading spinner
   */
  _stopSpinner: function() {
    if (this.spinner)
      this.spinner.stop()
  },

  /**
   *  Start loading spinner
   */
  _startSpinner: function($el) {
    this._stopSpinner();

    var $el = this.$el.find('.loading');

    if ($el) {
      // Check if it is dark or other to change color
      var template_dark = this.model.get('template_name').search('dark') != -1;

      if (template_dark) {
        this.spin_options.color = '#FFF';
      } else {
        this.spin_options.color = 'rgba(0,0,0,0.5)';
      }

      this.spinner = new Spinner(this.spin_options).spin();
      $el.append(this.spinner.el);
    }
  },

  /**
   *  Stop loading spinner
   */
  _containsCover: function() {
    return this.$el.find(".cartodb-popup.header").attr("data-cover") ? true : false;
  },


  /**
   *  Get cover URL
   */
  _getCoverURL: function() {
    var content = this.model.get("content");

    if (content && content.fields && content.fields.length > 0) {
      return (content.fields[0].value || '').toString();
    }

    return false;
  },

  /**
   *  Attempts to load the cover URL and show it
   */
  _loadCover: function() {

    if (!this._containsCover()) return;

    var
    self = this,
    $cover = this.$(".cover"),
    $shadow = this.$(".shadow"),
    url = this._getCoverURL();

    if (!this._isValidURL(url)) {
      $shadow.hide();
      cdb.log.info("Header image url not valid");
      return;
    }

    // configure spinner
    var
    target  = document.getElementById('spinner'),
    opts    = { lines: 9, length: 4, width: 2, radius: 4, corners: 1, rotate: 0, color: '#ccc', speed: 1, trail: 60, shadow: true, hwaccel: false, zIndex: 2e9 },
    spinner = new Spinner(opts).spin(target);

    // create the image
    var $img = $cover.find("img");

    $img.hide(function() {
      this.remove();
    });

    $img = $("<img />").attr("src", url);
    $cover.append($img);

    $img.load(function(){
      spinner.stop();

      var w  = $img.width();
      var h  = $img.height();
      var coverWidth = $cover.width();
      var coverHeight = $cover.height();

      var ratio = h / w;
      var coverRatio = coverHeight / coverWidth;

      // Resize rules
      if ( w > coverWidth && h > coverHeight) { // bigger image
        if ( ratio < coverRatio ) $img.css({ height: coverHeight });
        else {
          var calculatedHeight = h / (w / coverWidth);
          $img.css({ width: coverWidth, top: "50%", position: "absolute", "margin-top": -1*parseInt(calculatedHeight, 10)/2 });
        }
      } else {
        var calculatedHeight = h / (w / coverWidth);
        $img.css({ width: coverWidth, top: "50%", position: "absolute", "margin-top": -1*parseInt(calculatedHeight, 10)/2 });
      }

      $img.fadeIn(300);
    })
    .error(function(){
      spinner.stop();
    });
  },

  /**
   *  Return true if the provided URL is valid
   */
  _isValidURL: function(url) {
    if (url) {
      var urlPattern = /^(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-|]*[\w@?^=%&amp;\/~+#-])?$/
      return String(url).match(urlPattern) != null ? true : false;
    }

    return false;
  },

  /**
   *  Toggle infowindow visibility
   */
  toggle: function() {
    this.model.get("visibility") ? this.show() : this.hide();
  },

  /**
   *  Stop event bubbling
   */
  _stopBubbling: function (e) {
    e.preventDefault();
    e.stopPropagation();
  },

  /**
   *  Stop event propagation
   */
  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  /**
   *  Set loading state adding its content
   */
  setLoading: function() {
    this.model.set({
      content:  {
        fields: [{
          title: null,
          alternative_name: null,
          value: 'Loading content...',
          index: null,
          type: "loading"
        }],
        data: {}
      }
    })
    return this;
  },

  /**
   *  Set loading state adding its content
   */
  setError: function() {
    this.model.set({
      content:  {
        fields: [{
          title: null,
          alternative_name: null,
          value: 'There has been an error...',
          index: null,
          type: 'error'
        }],
        data: {}
      }
    })
    return this;
  },

  /**
   * Set the correct position for the popup
   */
  setLatLng: function (latlng) {
    this.model.set("latlng", latlng);
    return this;
  },

  /**
   *  Close infowindow
   */
  _closeInfowindow: function(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    if (this.model.get("visibility")) {
       this.model.set("visibility", false);
       this.trigger('close');
    }
  },

  /**
   *  Set visibility infowindow
   */
  showInfowindow: function() {
    this.model.set("visibility", true);
  },

  /**
   *  Show infowindow (update, pan, etc)
   */
  show: function (no_pan) {
    var self = this;

    if (this.model.get("visibility")) {
      self.$el.css({ left: -5000 });
      self._update(no_pan);
    }
  },

  /**
   *  Get infowindow visibility
   */
  isHidden: function () {
    return !this.model.get("visibility");
  },

  /**
   *  Set infowindow to hidden
   */
  hide: function (force) {
    if (force || !this.model.get("visibility")) this._animateOut();
  },

  /**
   *  Update infowindow
   */
  _update: function (no_pan) {

    if(!this.isHidden()) {
      var delay = 0;

      if (!no_pan) {
        var delay = this.adjustPan();
      }

      this._updatePosition();
      this._animateIn(delay);
    }
  },

  /**
   *  Animate infowindow to show up
   */
  _animateIn: function(delay) {
    if (!$.browser.msie || ($.browser.msie && parseInt($.browser.version) > 8 )) {
      this.$el.css({
        'marginBottom':'-10px',
        'display':'block',
        opacity:0
      });

      this.$el
      .delay(delay)
      .animate({
        opacity: 1,
        marginBottom: 0
      },300);
    } else {
      this.$el.show();
    }
  },

  /**
   *  Animate infowindow to disappear
   */
  _animateOut: function() {
    if (!$.browser.msie || ($.browser.msie && parseInt($.browser.version) > 8 )) {
      var self = this;
      this.$el.animate({
        marginBottom: "-10px",
        opacity:      "0",
        display:      "block"
      }, 180, function() {
        self.$el.css({display: "none"});
      });
    } else {
      this.$el.hide();
    }
  },

  /**
   *  Update the position (private)
   */
  _updatePosition: function () {
    if(this.isHidden()) return;

    var
    offset          = this.model.get("offset")
    pos             = this.mapView.latLonToPixel(this.model.get("latlng")),
    x               = this.$el.position().left,
    y               = this.$el.position().top,
    containerHeight = this.$el.outerHeight(true),
    containerWidth  = this.$el.width(),
    left            = pos.x - offset[0],
    size            = this.mapView.getSize(),
    bottom          = -1*(pos.y - offset[1] - size.y);

    this.$el.css({ bottom: bottom, left: left });
  },

  /**
   *  Adjust pan to show correctly the infowindow
   */
  adjustPan: function (callback) {
    var offset = this.model.get("offset");

    if (!this.model.get("autoPan") || this.isHidden()) { return; }

    var
    x               = this.$el.position().left,
    y               = this.$el.position().top,
    containerHeight = this.$el.outerHeight(true) + 15, // Adding some more space
    containerWidth  = this.$el.width(),
    pos             = this.mapView.latLonToPixel(this.model.get("latlng")),
    adjustOffset    = {x: 0, y: 0};
    size            = this.mapView.getSize()
    wait_callback   = 0;

    if (pos.x - offset[0] < 0) {
      adjustOffset.x = pos.x - offset[0] - 10;
    }

    if (pos.x - offset[0] + containerWidth > size.x) {
      adjustOffset.x = pos.x + containerWidth - size.x - offset[0] + 10;
    }

    if (pos.y - containerHeight < 0) {
      adjustOffset.y = pos.y - containerHeight - 10;
    }

    if (pos.y - containerHeight > size.y) {
      adjustOffset.y = pos.y + containerHeight - size.y;
    }

    if (adjustOffset.x || adjustOffset.y) {
      this.mapView.panBy(adjustOffset);
      wait_callback = 300;
    }

    return wait_callback;
  }

});

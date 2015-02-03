  /**
   *  Generate static image
   *
   *  new cdb.admin.StaticImageDialog({
   *    vis: visualization_model,
   *    user: user_model
   *  })
   *
   */

cdb.admin.StaticImageDialog = cdb.admin.BaseDialog.extend({

  events: {
    'click .ok':      '_ok',
    'click .cancel':  '_cancel',
    'click .close':   '_cancel'
  },

  _TEXTS: {
    title:       _t('Configure export options'),
    description: _t("The image will be centered using the map's current center"),
    ok:          _t('Export image')
  },

  initialize: function() {

    // Generate new model
    this.vis = this.options.vis;
    this.user = this.options.user;
    this.model = _.clone(this.vis);

    delete this.model.id;

    // Extend options
    _.extend(this.options, {
      title: this._TEXTS.title,
      description: this._TEXTS.description,
      width: 355,
      clean_on_hide: true,
      capture_width: this.options.width,
      capture_height: this.options.height,
      template_name: 'table/views/static_image_dialog',
      ok_title: this._TEXTS.ok,
      ok_button_classes: 'button grey',
      modal_class: 'static_image_dialog'
    });

    this.constructor.__super__.initialize.apply(this);
  },

  render: function() {
    this.$el.append(this.template_base( _.extend( this.options )));

    this.$(".modal").css({ width: this.options.width });

    if (this.options.modal_class) {
      this.$el.addClass(this.options.modal_class);
    }

    return this;
  },

  /**
   * Render the content for the metadata dialog
   */
  render_content: function() {
    var self = this;

    // Tags
    _.each(this.model.get('tags'), function(li) {
      this.$("ul").append("<li>" + li + "</li>");
    }, this);

    this.$("ul").tagit({
      allowSpaces:      true,
      onBlur: function() {
        self.$('ul').removeClass('focus')
      },
      onFocus: function() {
        self.$('ul').addClass('focus')
      },
      onSubmitTags: this.ok
    });

    return false;
  },

  _keydown: function(e) {
    if (e.keyCode === 27) this._cancel();
  },

  _getURL: function() {

    var endpoint = cdb.config.prefixUrl() + "/api/v1/map";

    endpoint = "http://development.localhost.lan:8181" + cdb.config.prefixUrl() + "/api/v1/map"; // TODO: just for test

    var layergroup_id = this.options.layergroup_id;

    var file_format = "png";

    var zoom   = this.vis.map.get("zoom");
    var lat    = this.vis.map.get("center")[0];
    var lng    = this.vis.map.get("center")[1];

    var width  = this.$el.find('input[name="width"]').val();
    var height = this.$el.find('input[name="height"]').val();
 
    var path = [
      endpoint,
      'static',
      'center',
      layergroup_id,
      zoom,
      lat,
      lng,
      width,
      height
    ].join('/');

    return path + '.' + file_format;

  },

  _ok: function(e) {
    this.killEvent(e);

    var vizjson = "http://" + location.host + "/api/v2/viz/" + this.vis.get("id") + "/viz.json";

    //vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json";

    var width  = this.$el.find('input[name="width"]').val();
    var height = this.$el.find('input[name="height"]').val();

    var zoom   = this.vis.map.get("zoom");
    var lat    = this.vis.map.get("center")[0];
    var lng    = this.vis.map.get("center")[1];
    console.log("calc")

    cdb.Image(vizjson).zoom(zoom).center([lat, lng]).size(width, height).getUrl(function(error, url) {
      console.log(url);
      window.open(url, '_blank');
    });

  },

  _showConfirmation: function() {
    this.$("section.modal:eq(0)")
    .animate({
      top:0,
      opacity: 0
    }, 300, function() {
      $(this).slideUp(300);
    });


    this.$(".modal.confirmation")
    .css({
      top: '50%',
      marginTop: this.$(".modal.confirmation").height() / 2,
      display: 'block',
      opacity: 0
    })
    .delay(200)
    .animate({
      marginTop: -( this.$(".modal.confirmation").height() / 2 ),
      opacity: 1
    }, 300);
  },

  // Clean methods
  _destroyCustomElements: function() {
    // Destroy tagit
    this.$('ul').tagit('destroy');
    // Destroy jscrollpane
    this.$('.metadata_list').data() && this.$('.metadata_list').data().jsp && this.$('.metadata_list').data().jsp.destroy();
  },

  clean: function() {
    this._destroyCustomElements();
    cdb.admin.BaseDialog.prototype.clean.call(this);
  }

});


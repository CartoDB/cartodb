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

    this.vis = this.options.vis;

    var attribution = this.vis.map.get("attribution");

    if (attribution && attribution.length > 1) {
      attribution = attribution.slice(0, attribution.length - 1).join(" ");
    } else {
      attribution = "";
    }

    // Extend options
    _.extend(this.options, {
      disabled: false,
      title: this._TEXTS.title,
      description: this._TEXTS.description,
      width: 355,
      clean_on_hide: true,
      capture_width: this.options.width,
      capture_height: this.options.height,
      attribution: attribution,
      template_name: 'table/views/static_image_dialog',
      ok_title: this._TEXTS.ok,
      ok_button_classes: 'button grey',
      cancel_title: "ok",
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

  _keydown: function(e) {
    if (e.keyCode === 27) this._cancel();
  },

  _ok: function(e) {

    if (this.options.disabled) return;

    this.options.disabled = true;

    this.killEvent(e);

    var vizjson = location.protocol + "//" + location.host + "/api/v2/viz/" + this.vis.get("id") + "/viz.json";

    var width  = this.$el.find('input[name="width"]').val();
    var height = this.$el.find('input[name="height"]').val();

    //var zoom  = this.vis.map.get("zoom");
    //var lat   = this.vis.map.get("center")[0];
    //var lng   = this.vis.map.get("center")[1];

    var $submit = this.$el.find(".ok.button");
    var $loader = this.$el.find(".js-loader");

    $submit.addClass("disabled");
    $loader.show();

    var self = this;

    cdb.Image(vizjson).size(width, height).getUrl(function(error, url) {

      $loader.hide();
      $submit.removeClass("disabled");
      self.options.disabled = false;

      if (error) {
        self._showError(error.errors[0]);
      } else {
        window.open(url, '_blank');
      }

    });

  },

  _showError: function(message) {

    this.$el.find(".js-error-message").html(message);

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

  clean: function() {
    cdb.admin.BaseDialog.prototype.clean.call(this);
  }

});


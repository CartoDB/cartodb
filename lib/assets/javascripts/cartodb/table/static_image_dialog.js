/**
 *  Generate static image
 *
 *  new cdb.admin.StaticImageDialog({
 *    vis: visualization_model
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

    _.bindAll(this, "_onImageCallback");

    // Extend options
    _.extend(this.options, {
      disabled: false,
      title: this._TEXTS.title,
      description: this._TEXTS.description,
      width: 355,
      error_width: 511,
      clean_on_hide: true,
      capture_width: this.options.width,
      capture_height: this.options.height,
      attribution: this.options.attribution,
      template_name: 'table/views/static_image_dialog',
      ok_title: this._TEXTS.ok,
      ok_button_classes: 'button grey',
      error_close_title: "Close",
      ok_button_classes: 'button grey',
      modal_class: 'static_image_dialog'
    });

    this.constructor.__super__.initialize.apply(this);
  },

  render: function() {

    this.$el.append(this.template_base( _.extend( this.options )));

    this.$(".modal").css({ width: this.options.width });
    this.$(".modal.warning").css({ width: this.options.error_width });

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

    this.privacy = this.options.privacy;

    this.killEvent(e);

    var width  = this.$el.find('input[name="width"]').val();
    var height = this.$el.find('input[name="height"]').val();

    var $submit = this.$el.find(".ok.button");

    $submit.addClass("disabled");

    this.$el.addClass("is-loading");

    this.user = this.options.user;
    this.url  = this.options.vizjson;

    var torqueStep = 0;

    if (table.mapTab.timeline && table.mapTab.timeline.torqueLayer) {
      torqueStep = table.mapTab.timeline.torqueLayer.getStep();
    }

    cdb.Image(this.url, { https: this._isHTTPS(), step: torqueStep }).size(width, height).getUrl(this._onImageCallback);

  },

  _isHTTPS: function() {
    return location.protocol.indexOf("https") === 0;
  },

  _onImageCallback: function(error, url) {

    this.$el.removeClass("is-loading");

    this.$el.find(".ok.button").removeClass("disabled");

    this.options.disabled = false;

    if (error && error.errors) {
      this._showError(error.errors[0]);
    } else {
      window.open(url, '_blank');
    }

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

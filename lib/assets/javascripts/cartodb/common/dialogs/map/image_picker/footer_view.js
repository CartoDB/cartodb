var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({

  _TEXTS: {
    ok:           {
      simple_icons: _t('Set image'),
      pin_icons:    _t('Set image'),
      maki_icons:   _t('Set image'),
      your_icons:   _t('Set image'),
      upload_file:  _t('Upload image'),
      dropbox:      _t('Upload image'),
      box:      _t('Upload image')
    }
  },

  events: {
    'click .js-ok': '_finish'
  },

  initialize: function() {
    this.elder('initialize');
    this._template = cdb.templates.getTemplate('common/dialogs/map/image_picker/footer_template');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var action = this._TEXTS.ok[this.model.get('pane')] || "Set image";
    var options = _.extend(this.model.attributes, { action:  action });
    var $el = $(this._template(options));

    this.$el.html($el);

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('change:disclaimer', this._updateFooterInfo, this);
  },

  _updateFooterInfo: function() {
    this.$el.find(".js-footer-info").html(this.model.get("disclaimer"));
  },

  _finish: function(e) {
    this.killEvent(e);

    if (this.model.get("submit_enabled")) {
      this.trigger("finish", this);
    }
  }
});

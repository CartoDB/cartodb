var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');

/**
 *  Asset item previewing image
 *
 *  - It needs a model with asset url and state (is-idle, is-selected, is-destroying).
 *
 *  new AssetsItemView({
 *    model: asset_model
 *  })
 */
module.exports = cdb.core.View.extend({

  _SIZE: 60, // Thumbnail size (same cm for width and height)
  _MIN_SIZE: 32, // Minimal thumbnail size (same cm for width and height)

  tagName: 'li',

  options: {
    template: 'common/dialogs/map/image_picker/assets_item'
  },

  events: {
    'click a.delete': '_openDropdown',
    'click':          '_onClick'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate(this.options.template);
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.append(this.template(this.model.toJSON()));

    this._calcBkgImg(this.model.get("public_url"));

    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_onClick', '_openDropdown');

    this.model.bind('change:state', this._changeState, this);
    this.model.bind('destroy', this.remove, this);
  },

  _calcBkgImg: function(src) {
    var img = new Image();
    var self = this;

    img.onload = function() {
      var w = this.width;
      var h = this.height;

      var $thumbnail = self.$("a.image");

      self.$el.css("background","none");

      if(self.model.get("kind") === 'marker') {
        if(h > self._SIZE) {
          $thumbnail.css({
            "background-size":  "cover",
            "background-origin": "content-box"
          });
        } else if ((w || h) < self._MIN_SIZE) {
          // Scale up images smaller than considered min size (e.g. maki icons).
          $thumbnail.css({
            "background-size": self._MIN_SIZE + "px"
          });
        }
      } else {
        if ((w || h) > self._SIZE) {
          $thumbnail.css({
            "background-size":  "cover",
            "background-origin": "content-box"
          });
        } else {
          $thumbnail.css({
            "background-position": "0 0",
            "background-repeat": "repeat"
          });
        }
      }
    }

    img.onerror = function(e){ cdb.log.info(e) };
    img.src = src;
  },

  _onClick: function(e) {
    this.killEvent(e);

    if (this.model.get('state') !== 'selected' && this.model.get('state') != 'destroying') {
      this.trigger('selected', this.model);
      this.model.set('state', 'selected');
    }
  },

  _changeState: function() {
    this.$el
      .removeClass('is-idle is-selected is-destroying')
      .addClass("is-" + this.model.get('state'));
  },

  _openDropdown: function(e) {
    var self = this;

    this.killEvent(e);
    e.stopImmediatePropagation();

    this.dropdown = new cdb.admin.DropdownMenu({
      className: 'dropdown border tiny',
      target: $(e.target),
      width: 196,
      speedIn: 150,
      speedOut: 300,
      template_base: 'common/dialogs/map/image_picker/remove_asset',
      vertical_position: "down",
      horizontal_position: "left",
      horizontal_offset: 3,
      tick: "left"
    });

    this.dropdown.bind("optionClicked", function(ev) {
      ev.preventDefault();
      self._deleteAsset();
    });

    $('body').append(this.dropdown.render().el);
    this.dropdown.open(e);
    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);
  },

  _deleteAsset: function() {
    var self = this;
    this.model.set('state', 'destroying');

    this.model.destroy({
      success: function() {},
      error: function() {
        self.model.set('state', 'idle');
      }
    })
  }
});

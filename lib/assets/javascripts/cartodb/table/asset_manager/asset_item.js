
  /**
   *  Asset item previewing image
   *  - It needs a model with asset url and state (idle, selected, destroying).
   *
   *  new cdb.admin.AssetsItem({
   *    model: asset_model
   *  })  
   */

  cdb.admin.AssetsItem = cdb.core.View.extend({
    
    tagName: 'li',
    
    className: 'assets-item',

    events: {
      'click a.delete': '_openDropdown',
      'click':          '_onClick'
    },

    initialize: function() {
      _.bindAll(this, '_onClick', '_openDropdown');

      this.template = cdb.templates.getTemplate('table/views/asset_manager/asset_item');
      
      this.model.bind('change:state', this._changeState, this);
      this.model.bind('destroy', this.remove, this);
    },
    
    render: function() {
      this.clearSubViews();
      this.$el.append(this.template(this.model.toJSON()));

      this._calcBkgImg(this.model.get("public_url"));

      return this;
    },

    _calcBkgImg: function(src) {
      var self = this;

      var img = new Image();

      img.onload = function() {
        var w = this.width;
        var h = this.height;

        var $thumbnail = self.$("a.image");

        self.$el.css("background","none");

        if(self.model.get("kind") === 'marker') {
          if(h > 42) {
            $thumbnail.css({
              "background-size":  "cover",
              "background-origin": "content-box"
            });
          }
        } else {
          if((w || h) > 42) {
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
      };

      img.onerror = function() {}

      img.src = src;
    },

    _onClick: function(e) {
      this.killEvent(e);

      if (this.model.get('state') != 'selected' && this.model.get('state') != 'destroying') {
        this.trigger('selected', this.model);
        this.model.set('state', 'selected');
      }
    },

    _changeState: function() {
      this.$el
        .removeClass('idle selected destroying')
        .addClass(this.model.get('state'));
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
        template_base: 'table/views/asset_manager/remove_asset',
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
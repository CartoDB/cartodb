
cdb.geo.ui.Tooltip = cdb.geo.ui.InfoBox.extend({

  defaultTemplate: '<p>{{text}}</p>',
  className: 'cartodb-tooltip',

  defaults: {
    vertical_offset: 0,
    horizontal_offset: 0,
    position: 'top|center'
  },

  initialize: function() {
    this.options.template = this.options.template || this.defaultTemplate;
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);
    this._filter = null;
    this.showing = false;
    this.showhideTimeout = null;
  },

  setLayer: function(layer) {
    this.options.layer = layer;
    return this;
  },

  /**
   * sets a filter to open the tooltip. If the feature being hovered
   * pass the filter the tooltip is shown
   * setFilter(null) removes the filter
   */
  setFilter: function(f) {
    this._filter = f;
    return this;
  },

  setFields: function(fields) {
    this.options.fields = fields;
    return this;
  },

  setAlternativeNames: function(n) {
    this.options.alternative_names = n;
  },

  enable: function() {
    if(this.options.layer) {
      // unbind previous events
      this.options.layer.unbind(null, null, this);
      this.options.layer
        .on('mouseover', function(e, latlng, pos, data) {
          // this flag is used to be compatible with previous templates
          // where the data is not enclosed a content variable
          if (this.options.fields) {

            var non_valid_keys = ['fields', 'content'];

            if (this.options.omit_columns) {
              non_valid_keys = non_valid_keys.concat(this.options.omit_columns);
            }

            var c = cdb.geo.ui.InfowindowModel.contentForFields(data, this.options.fields, {
              empty_fields: this.options.empty_fields
            });
            // Remove fields and content from data
            // and make them visible for custom templates
            data.content = _.omit(data, non_valid_keys);

            // loop through content values
            data.fields = c.fields;

            // alternamte names
            var names = this.options.alternative_names;
            if (names) {
              for(var i = 0; i < data.fields.length; ++i) {
                var f = data.fields[i];
                f.title = names[f.title] || f.title;
              }
            }
          }
          this.show(pos, data);
          this.showing = true;
        }, this)
        .on('mouseout', function() {
          if (this.showing) {
            this.hide();
            this.showing = false;
          }
        }, this);
      this.add_related_model(this.options.layer);
    }
  },

  disable: function() {
    if(this.options.layer) {
      this.options.layer.unbind(null, null, this);
    }
    this.hide();
    this.showing = false;
  },

  _visibility: function() {
    var self = this;
    clearTimeout(this.showhideTimeout);
    this.showhideTimeout = setTimeout(self._showing ?
      function() { self.$el.fadeIn(100); }
      :
      function() { self.$el.fadeOut(200); }
    , 50);
  },

  hide: function() {
    if (this._showing) {
      this._showing = false;
      this._visibility();
    }
  },

  show: function(pos, data) {
    if (this._filter && !this._filter(data)) {
      return this;
    }
    this.render(data);
    //this.elder('show', pos, data);
    this.setPosition(pos);
    if (!this._showing) {
      this._showing = true;
      this._visibility();
    }
    return this;
  },

  setPosition: function(point) {
    var props = {
      left: 0,
      top:  0
    };

    var pos = this.options.position;
    var $el = this.$el;
    var h = $el.innerHeight();
    var w = $el.innerWidth();

    // Vertically
    if (pos.indexOf('top') !== -1) {
      props.top = -h;
    } else if (pos.indexOf('middle') !== -1) {
      props.top = -(h/2);
    }

    // Horizontally
    if(pos.indexOf('left') !== -1) {
      props.left = -w;
    } else if(pos.indexOf('center') !== -1) {
      props.left = -(w/2);
    }

    // Offsets
    props.top += this.options.vertical_offset;
    props.left += this.options.horizontal_offset;

    $el.css({
      top:  (point.y + props.top),
      left: (point.x + props.left)
    });

  },

  render: function(data) {
    this.$el.html( this.template(data) );
    return this;
  }

});


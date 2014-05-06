
cdb.geo.ui.Tooltip = cdb.geo.ui.InfoBox.extend({

  DEFAULT_OFFSET_TOP: 30,
  defaultTemplate: '<p>{{text}}</p>',
  className: 'cartodb-tooltip',

  initialize: function() {
    this.options.template = this.options.template || this.defaultTemplate;
    this.options.position = 'none';
    this.options.width = null;
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);
    this._filter = null
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

  enable: function() {
    if(this.options.layer) {
      this.options.layer
        .on('mouseover', function(e, latlng, pos, data) {
          // this flag is used to be compatible with previous templates
          // where the data is not enclosed a content variable
          if (this.options.wrapdata) {
            data = {
              content: data,
              fields: _.map(data, function(v, k) {
                return {
                  title: k,
                  value: v
                };
              })
            };
          }
          this.show(pos, data);
        }, this)
        .on('featureOut', function() {
          this.hide();
        }, this);
      this.add_related_model(this.options.layer);
    }
  },

  disable: function() {
    if(this.options.layer) {
      this.options.layer.unbind(null, null, this);
    }
  },

  show: function(pos, data) {
    if (this._filter && !this._filter(data)) {
      return this;
    }
    this.render(data);
    this.elder('show', pos, data);
    this.$el.css({
      'left': (pos.x - this.$el.width()/2),
      'top': (pos.y - (this.options.offset_top || this.DEFAULT_OFFSET_TOP))
    });
    return this;
  },


  render: function(data) {
    this.$el.html( this.template(data) );
    return this;
  }

});


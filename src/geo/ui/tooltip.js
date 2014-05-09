
cdb.geo.ui.Tooltip = cdb.geo.ui.InfoBox.extend({

  DEFAULT_OFFSET_TOP: 10,
  defaultTemplate: '<p>{{text}}</p>',
  className: 'cartodb-tooltip',

  initialize: function() {
    this.options.template = this.options.template || this.defaultTemplate;
    this.options.position = 'none';
    this.options.width = null;
    cdb.geo.ui.InfoBox.prototype.initialize.call(this);
    this._filter = null;
    this.showing = false;
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
      this.options.layer
        .on('mouseover', function(e, latlng, pos, data) {
          // this flag is used to be compatible with previous templates
          // where the data is not enclosed a content variable
          if (this.options.fields) {

            var non_valid_keys = ['fields', 'content'];

            if (this.options.omit_columns) {
              non_valid_keys = non_valid_keys.concat(this.options.omit_columns);
            }

            var c = cdb.geo.ui.InfowindowModel.contentForFields(data, this.options.fields);
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
        .on('featureOut', function() {
          this.hide();
          this.showing = false;
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
      'left': pos.x,
      'top':  pos.y + (this.options.offset_top || this.DEFAULT_OFFSET_TOP)
    });
    return this;
  },


  render: function(data) {
    this.$el.html( this.template(data) );
    return this;
  }

});


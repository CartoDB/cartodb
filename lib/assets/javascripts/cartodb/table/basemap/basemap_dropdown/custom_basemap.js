
/**
 *  Layers based on Leaflet
 */
cdb.admin.BaseMapView = cdb.admin.BaseLayerButton.extend({

  events: {
    'click .remove_layer': '_openDropdown',
    'click': 'activate'
  },

  defaults: {
    // subdomain by default 'a'
    s: 'a',
    // x,y,z position of the base tile preview
    x: 30,
    y: 24,
    z: 6
  },

  tagName: 'li',
  className: 'leaflet',

  initialize: function() {

    this.options = _.defaults(this.options,this.defaults);
    this.map = this.options.map;
    this.model.bind('destroy', this.clean, this);
    this.bindMap(this.map);
  },

  render: function() {

    //TODO: move this to model
    var back_tile = this.model.get("urlTemplate")
    .replace("{s}", this.options.s)
    .replace("{z}", this.options.z)
    .replace("{x}", this.options.x)
    .replace("{y}", this.options.y);

    var $e;

    var type      = this.model.get("type") && this.model.get("type").toLowerCase();
    var className = this.model.get('className');

    if (type === 'wms') {
      $e = $("<div class='thumb'></div> <div class='name'>" + this.model.get("name") + "</div>" );
    } else {
      $e = $("<div class='thumb' style='background-image:url(" + back_tile + ")'></div> <div class='name'>" + this.model.get("name") + "</div><small>max zoom: " + this.model.get("maxZoom") + "</small>" );
    }

    var $a = $(this.make("a", { "class": className }, $e));

    if (!this.model.get('read_only')) {
      del = this.make("span", {"class": "remove_layer"});
      $a.find(".thumb").append(del);
    }

    this.$el.html($a);
    this.$el.attr('data-tipsy', this.model.get("name"));
    this.$el.attr("title", this.model.get("name"));

    var self = this;

    this.elder('render');

    return this;
  },


  activate: function(e) {
    e.preventDefault();
    e.stopPropagation();
    cdb.god.trigger("closeDialogs");

    // when the user selects a normal base layer select leaflet by default
    var lyr = this.model.clone();
    lyr.set('id', undefined); // force creation
    this.map.changeProvider('leaflet', lyr);

    return false;
  },

  _openDropdown: function(ev) {
    var self = this;

    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    this.dropdown = new cdb.admin.DropdownMenu({
      className: 'dropdown border short',
      target: this.$('.remove_layer'),
      width: 196,
      speedIn: 150,
      speedOut: 300,
      template_base: 'table/views/remove_layer_content',
      vertical_position: "down",
      horizontal_position: "left",
      horizontal_offset: 3,
      clean_on_hide: true,
      tick: "left"
    });

    this.dropdown.bind("optionClicked", function(ev) {
      ev.preventDefault();
      self.model.destroy();
    });

    $('body').append(this.dropdown.render().el);
    this.dropdown.open(ev);
    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

    return false;
  }
});

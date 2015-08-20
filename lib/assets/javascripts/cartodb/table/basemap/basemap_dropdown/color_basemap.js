
/**
 *  Color Base layer
 */
cdb.admin.BackgroundMapColorView = cdb.admin.BaseLayerButton.extend({

  events: {
    'click': '_openPicker'
  },

  tagName: 'li',
  className: 'map_background',

  initialize: function() {
    _.bindAll(this, 'setColor');
    this.map = this.options.map;
    this.template = cdb.templates.getTemplate('table/views/basemap/color_basemap');
    this.bindMap(this.map);
    this.map.bind('savingLayersFinish', this._changeModel, this);
    this._initBinds();
  },

  render: function() {
    this.$el.html(this.template(this.model.attributes));
    this.elder('render');
    return this;
  },

  activate: function(color) {
    var lyr = new cdb.admin.PlainLayer({
      color: color,
      image: '',
      maxZoom: 32 //allow the user to zoom to the atom
    });

    this.model = lyr;

    this.map.changeProvider('leaflet', lyr);

    return false;
  },

  _changeModel: function() {
    if (this.model) {
      this.model.unbind(null, null, this);  
    }
    
    this.model = this.map.getBaseLayer();
    this._initBinds();
    this.render();
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  _createPicker: function() {
    var self = this;

    this.color_picker = new cdb.admin.ColorPicker({
      className: 'dropdown color_picker basemap border vertical_offset',
      target: this.$el,
      vertical_position: "down",
      horizontal_position: "left",
      vertical_offset: 40,
      horizontal_offset: 50,
      tick: "top",
      dragUpdate: false
    }).bind("colorChosen", this.setColor, this);

    this._bindPicker();
    this.addView(this.color_picker);
  },

  _destroyPicker: function() {
    if (this.color_picker) {
      this._unbindPicker();
      this.removeView(this.color_picker);
      this.color_picker.hide();
      delete this.color_picker;
    }
  },

  _bindPicker: function() {
    cdb.god.bind("closeDialogs", this._destroyPicker, this);
  },

  _unbindPicker: function() {
    cdb.god.unbind("closeDialogs", this._destroyPicker, this);
  },

  setColor: function(color, close) {
    if (close) cdb.god.trigger("closeDialogs");

    // Set new model
    this.activate(color);

    // Render color
    this.render();

    // Set general thumb
    $("ul.options .basemap_dropdown .info strong").text("Color: " + color);
    $("ul.options .basemap_dropdown a.thumb").css("background-color", color);

    this.selectButton();

    // TODO: remove mixpanel
    cdb.god.trigger('mixpanel', "Applying a color as basemap", { color: color });

    // Event tracking "Applied color as basemap"
    cdb.god.trigger('metrics', 'color_basemap', {
      email: window.user_data.email
    });
  },

  _openPicker: function(e) {
    this.killEvent(e);
    
    if (this.color_picker) this._destroyPicker();

    if (!this.color_picker) {
      this._createPicker();
      $('body').append(this.color_picker.render().el);
      this.color_picker.init(this.model.get('color'));
    }
  },

  selectButton: function() {
    this.$el.closest('.dropdown.basemap').find('li.selected').removeClass('selected');
    this.$el.addClass('selected');
  }
});

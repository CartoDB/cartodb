
/**
 *  Base layer button View that applies the correct layer to the map
 */
cdb.admin.BaseLayerButton = cdb.core.View.extend({

  bindMap: function(map) {
    map.bind('savingLayers', this.disable, this);
    map.bind('savingLayersFinish', this.enable, this);
  },

  disable: function() {
    this.$el.addClass('disabled');
    this.undelegateEvents();
  },

  enable: function() {
    this.$el.removeClass('disabled');
    this.delegateEvents();
  },

  selectButton: function() {
    this.$el.parents('.dropdown.basemap').find('li.selected').removeClass('selected');
    this.$el.addClass('selected');
  }

});
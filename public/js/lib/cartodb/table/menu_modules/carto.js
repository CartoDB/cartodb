/**
 * menu bar carto module
 * this module allows to edit Carto style
 */

cdb.admin.mod = cdb.admin.mod || {};

(function() {


cdb.admin.mod.Carto = cdb.core.View.extend({

    buttonClass: 'carto_mod',
    type: 'tool',

    events: {
      'click button': 'applyStyle'
    },

    initialize: function() {
      this.template = this.getTemplate('table/menu_modules/views/carto');
      this.model.bind('change:style', this._updateStyle, this);
    },

    activated: function() {
      this.$('textarea').focus();
    },

    render: function() {
      this.$el.append(this.template({}));
      this._updateStyle();
      return this;
    },

    _updateStyle: function(){
      this.$('textarea').val(this.model.get('style'));
    },

    _parseError: function(err) {
      this.$('.error').html(err.errors.join('<br/>'));
    },

    _clearErrors: function() {
      this.$('.error').html('');
    },

    applyStyle: function() {
      cdb.log.debug("compiling carto");
      var style = this.$('textarea').val();
      // compile and validate
      this.model.set({ tile_style: style });
    }

});


}());

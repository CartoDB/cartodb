/**
 * menu bar carto module
 * this module allows to edit Carto style
 */

cdb.admin.mod = cdb.admin.mod || {};

(function() {


/**
 * module to change cartoCSS 
 * is rendered on the right panel of map
 */
cdb.admin.mod.Carto = cdb.core.View.extend({

  buttonClass: 'carto_mod',
  type: 'tool',

  events: {
    'click .wizard': 'enableWizard',
    'click .editor': 'enableEditor'
  },

  initialize: function() {
    this.panels = new cdb.ui.common.TabPane();
    this.template = this.getTemplate('table/menu_modules/views/carto');
  },

  render: function() {
    this.$el.append(this.template({}));
    this.panels.setElement(this.$('.panels'));

    // panels
    this.panels.addTab('editor', new cdb.admin.mod.CartoEditor({
      model: this.model, // dataLayer
      table: this.options.table
    }).render());

    this.panels.addTab('wizard', new cdb.admin.mod.CartoWizard({
      model: this.model, // datalayer
      table: this.options.table
    }).render());

    return this;
  },

  enableWizard: function(ev) {
    ev.preventDefault();
    this.panels.active('wizard');
    return false;
  },

  enableEditor: function(ev) {
    ev.preventDefault();
    this.panels.active('editor');
    return false;
  }

});



}());

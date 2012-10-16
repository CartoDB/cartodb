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
      'click nav a.wizard': 'enableWizard',
      'click nav a.editor': 'enableEditor'
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
        table: this.options.table,
        className: "editor"
      }).render());

      this.panels.addTab('wizard', new cdb.admin.mod.CartoWizard({
        model: this.model, // datalayer
        table: this.options.table,
        className: "wizard"
      }).render());

      return this;
    },

    enableWizard: function(ev) {
      ev.preventDefault();

      // Add - Remove selected class
      this.setSelected(ev);

      this.panels.active('wizard');
      this.trigger('enable', 'wizard');

      return false;
    },

    enableEditor: function(ev) {
      ev.preventDefault();

      // Add - Remove selected class
      this.setSelected(ev);

      this.panels.active('editor');
      this.trigger('enable', 'carto');

      return false;
    },

    setSelected: function(ev) {
      // Add - Remove selected class
      this.$el.find("nav > a").removeClass("selected");
      $(ev.target).addClass("selected");
    }

  });

}());

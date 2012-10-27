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
      this.active = 'wizard';
      this.template = this.getTemplate('table/menu_modules/views/carto');
    },

    render: function() {
      var self = this;
      this.$el.append(this.template({}));
      this.panels.setElement(this.$('.panels'));

      // panels
      var editorPanel = new cdb.admin.mod.CartoEditor({
        model: this.model, // dataLayer
        table: this.options.table,
        className: "editor"
      });
      this.panels.addTab('editor', editorPanel.render());
      this.retrigger('hasErrors', editorPanel);
      this.retrigger('clearError', editorPanel);

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
      this.active = 'wizard';
      this._setSelected('wizard');

      this.panels.active('wizard');
      this.trigger('enable', 'wizard');

      return false;
    },

    enableEditor: function(ev) {
      ev.preventDefault();

      // Add - Remove selected class
      this.active = 'carto';
      this._setSelected('editor');

      this.panels.active('editor');
      this.trigger('enable', 'carto');

      return false;
    },

    _setSelected: function(name) {
      // Add - Remove selected class
      this.$el.find("nav > a").removeClass("selected");
      this.$("nav > a." + name).addClass("selected");
    },

    active: function(name) {
      if(name == 'carto') {
        this.enableEditor();
      } else {
        this.enableWizard()
      }
    }

  });

}());

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

    buttonClass: 'style_mod',
    type: 'tool',

    events: {
      'click nav a.wizard': 'enableWizard',
      'click nav a.editor': 'enableEditor',
      'click .doc_info':    '_showDoc'
    },

    initialize: function() {
      this.panels = new cdb.ui.common.TabPane();
      this.active = 'wizard';
      this.template = this.getTemplate('table/menu_modules/views/carto');
    },

    tableHasData: function() {
      if(this.options &&
        this.options.table &&
        this.options.table.data &&
        this.options.table.data().models
        ) {
        return this.options.table.data().models.length > 0;
      }
      return false;

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
      this.options.table.bind('dataLoaded', this.addWizard.bind(this));
      this.options.table.bind('dataAdded', this.addWizard.bind(this));
      this.options.table.bind('dataAdded', function(){console.log('a');});

      return this;

    },

    addWizard: function(ev) {
      if(!this.wizzardAdded  && this.tableHasData()) {
        this.panels.addTab('wizard', new cdb.admin.mod.CartoWizard({
          model: this.model, // datalayer
          table: this.options.table,
          className: "wizard"
        }).render());
        this.wizzardAdded = true;
        this.$('a.wizard').show();
      } else {
        this.$('a.wizard').hide();
      }
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
    },

    _showDoc: function(ev) {
      ev.preventDefault();
      var dialog = new cdb.admin.CartoCSSInfo();
      $("body").append(dialog.render().el);
      dialog.open();
    }

  });

}());

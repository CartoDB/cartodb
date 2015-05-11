
  /**
   *  Import empty pane
   *
   *  Pane showing empty 
   *
   *
   *  new cdb.admin.ImportEmptyPane(opts);
   *
  */

  cdb.admin.ImportEmptyPane = cdb.admin.ImportPane.extend({

    className: 'create-empty',


    initialize: function() {
      cdb.admin.ImportPane.prototype.initialize.call(this);

      this.model.set({
        value: 'empty',
        type:  'empty',
        valid: true
      });

      this.render();
    },

    render: function() {
      return this;
    }

  });
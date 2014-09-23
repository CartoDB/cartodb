
  /**
   *  Pane for import a ArcGIS files
   *
   *  - It needs a 
   *
   *  new cdb.admin.ImportTwitterPane()
   */

  cdb.admin.ImportArcGISPane = cdb.admin.ImportPane.extend({
    
    className: "import-pane import-arcgis-pane",

    events: {
      'submit form':    '_onSubmitForm',
      'keydown input':  '_onInputChange'
    },

    initialize: function() {

      this.user = this.options.user;
      
      this.model = new cdb.core.Model({
        type:             'service',
        value:            '',
        interval:         '0',
        service_name:     'arcgis',
        service_item_id:  '',
        valid:            false
      });

      this.template = cdb.templates.getTemplate(this.options.template || 'common/views/import/import_arcgis');

      this.render();

      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      this.$el.append( this.template() );

      this._initViews();

      return this;
    },

    _initViews: function() {

    },

    _initBinds: function() {
      _.bindAll(this, '_onInputChange', '_onSubmitForm');
    },

    _onInputChange: function(e) {
      var value = $(e.target).val();
      
      this.model.set({
        value:            value,
        service_item_id:  value,
        valid:            this._checkValid(value)
      });

      this._triggerAction('valueChange', value);
    },

    _onSubmitForm: function(e) {
      if (e) this.killEvent(e);

      if (this.model.get('valid')) {
        this._triggerAction('fileChosen', this.model.attributes);
      }
    },

    _triggerAction: function(eventName, params) {
      this.trigger(eventName, params, this);
    },

    _checkValid: function(str) {
      return cdb.Utils.isURL(str);
    }

  });
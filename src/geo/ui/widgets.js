
cdb.Widget = {};

cdb.Widget.Model = cdb.core.Model.extend({

});

cdb.Widget.View = cdb.core.View.extend({

  className: 'Widget',

  options: {
    template: '',
    sync: true
  },

  initialize: function() {
    this.model = new cdb.core.Model({
      state: 'idle',
      sync: this.options.sync
    });
    this.datasource = this.options.datasource;//  && this.options.datasource.getInstance();
    this.template = _.template(this.options.template);
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template(this.options) // + data!
    )

    return this;
  },

  _initBinds: function() {
    var self = this;

    this.datasource.bind('loading', function(){
      this.model.set('state', 'loading');
      this.datasource.unbind('loading', null, this);

      var onDone = function() {
        this.datasource.unbind('error reset', null, this);
        this[ this.model.get('sync') ? '_bindDatasource' : '_unbindDatasource' ]();
      }

      this.datasource.bind('reset', function() {
        this.render();
        onDone();
      }, this);

      this.datasource.bind('error', function() {
        this._disable();
        onDone();
      }, this);
    }, this);
  },

  _bindDatasource: function() {
    this.datasource.bind('loading', function() {
      this.model.set('state', 'loading');
      this.render();
    }, this);
    this.datasource.bind('reset', function() {
      this.model.set('state', 'reset');
      this.render();
    }, this);
    this.datasource.bind('error', function() {
      this.model.set('state', 'error');
      this.render();
    }, this);
  },

  _unbindDatasource: function() {
    this.datasource.unbind('loading reset error', null, this);
  },

  sync: function() {
    this.model.set('sync', true);
  },

  unsync: function() {
    this.model.set('sync', false);
  },

  _disable: function() {

  }

});

cdb.Widget.ListView = cdb.Widget.View.extend();

var FiltersView = require('new_dashboard/filters_view');
var Router = require('new_dashboard/router');
var LocalStorage = require('new_common/local_storage');
var Backbone = require('backbone');
var $ = require('jquery');

describe('new_dashboard/filters_view', function() {
  beforeEach(function() {

    this.user = new cdb.admin.User({ username: 'paco' });
    this.router = new Router({ rootUrl: '' });
    this.router.model.set('content_type', 'datasets');

    this.collection = new cdb.admin.Visualizations();
    this.localStorage = new LocalStorage();
    
    this.view = new FiltersView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection,
      localStorage: this.localStorage 
    })
  });

  it('should render on change events by router model', function() {
    var args = this.router.model.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
    expect(args[1]).toEqual(this.view.render);
    expect(args[2]).toEqual(this.view);
  });

  // describe('render', function() {

  //   describe('regular user', function() {

  //     it('should render datasets links and filters', function() {
        
  //     })

  //     it('shouldn\'t render shared datasets because user doesn\'t belongs to an org', function() {
        
  //     })

  //   });

  //   describe('organization', function() {

  //     it('should render datasets links and filters', function() {
        
  //     })

  //     it('should render shared datasets if user belongs to an org', function() {
        
  //     })

  //   });

  // });

  it('should have no leaks', function() {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});

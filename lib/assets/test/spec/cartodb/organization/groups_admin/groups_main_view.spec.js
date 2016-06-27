var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var GroupsMainView = require('../../../../../javascripts/cartodb/organization/groups_admin/groups_main_view');

describe('organization/groups_admin/groups_main_view', function() {

  beforeEach(function() {
    this.contentView = new cdb.core.View();
    spyOn(this.contentView, 'render').and.callThrough();
    this.routerModel = new cdb.core.Model({
      view: this.contentView
    });
    this.router = new cdb.core.Model();
    this.router.model = this.routerModel;

    this.view = new GroupsMainView({
      router: this.router,
      groups: this.groups
    });
    this.view.render();
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the view given by router model', function() {
    expect(this.contentView.render).toHaveBeenCalled();
    expect(this.view.el).toEqual(this.contentView.el.parentNode);
  });

  afterEach(function() {
    this.view.clean();
  });

});

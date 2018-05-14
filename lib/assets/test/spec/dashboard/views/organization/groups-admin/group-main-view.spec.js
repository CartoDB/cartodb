const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const GroupsMainView = require('dashboard/views/organization/groups-admin/groups-main-view');

describe('dashboard/views/organization/groups-admin/groups-main-view', function () {
  beforeEach(function () {
    this.contentView = new CoreView();
    spyOn(this.contentView, 'render').and.callThrough();

    this.routerModel = new Backbone.Model({
      view: this.contentView
    });
    this.router = new Backbone.Model();
    this.router.model = this.routerModel;

    this.view = new GroupsMainView({
      routerModel: this.router,
      groups: this.groups
    });
    this.view.render();
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the view given by router model', function () {
    expect(this.contentView.render).toHaveBeenCalled();
    expect(this.view.el).toEqual(this.contentView.el.parentNode);
  });

  afterEach(function () {
    this.view.clean();
  });
});

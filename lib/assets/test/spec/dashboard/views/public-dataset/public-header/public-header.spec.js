const $ = require('jquery');
const PublicHeader = require('dashboard/views/public-dataset/public-header/public-header');
const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const CartoTableMetadataFixture = require('fixtures/dashboard/carto-table-metadata.fixture');
const UserModel = require('fixtures/dashboard/user-model.fixture');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/public-dataset/public-header/public-header', function () {
  let view, $el, table, userModel;

  beforeEach(function () {
    // Testing that it's SaaS (Related info: app/helpers/application_helper.rb)
    configModel.set('cartodb_com_hosted', false);

    userModel = new UserModel();

    $el = $('<header>').addClass('cartodb-public-header');
    table = new CartoTableMetadata({ name: 'test_table', geometry_types: ['st_polygon'] }, { configModel });

    view = new PublicHeader({
      el: $el,
      model: userModel,
      vis: table,
      current_view: 'dashboard',
      owner_username: 'test',
      isMobileDevice: false
    });
  });

  afterEach(function () {
    view.clean();
  });

  it("should render properly when authenticated users are 'empty'", function () {
    view.render();
    expect(view.$('ul.options li a').size()).toBe(3);
    expect(view.$('ul.options li a.account').size()).toBe(0);
    expect(view.$('ul.options li a.login').size()).toBe(1);
  });

  it("should render properly when authenticated users are 'empty' and it is a mobile device", function () {
    view.options.isMobileDevice = true;
    view.render();
    expect(view.$('ul.options li a').size()).toBe(2);
    expect(view.$('ul.options li a.account').size()).toBe(0);
    expect(view.$('ul.options li a.login').size()).toBe(1);
    expect(view.$('ul.options li a.signup').size()).toBe(1);
  });

  it('should render properly when authenticated user is filled and it is in dashboard view', function () {
    userModel.set({ urls: ['http://test.carto.com/dashboard'], username: 'test' });

    expect(view.$('ul.options li a').size()).toBe(1);
    expect(view.$('ul.options li a.account').size()).toBe(1);
    expect(view.$('ul.options li a.login').size()).toBe(0);
    expect(view.$('ul.options li a.signup').size()).toBe(0);
  });

  it('should render properly when authenticated user is filled and it is in table or visualization view, edit button should appear', function () {
    view.options.current_view = 'table';
    userModel.set({ urls: ['http://test.carto.com/dashboard'], username: 'test' });

    expect(view.$('ul.options li a').size()).toBe(1);
    expect(view.$('ul.options li a.account').size()).toBe(1);
    expect(view.$('ul.options li a.login').size()).toBe(0);
    expect(view.$('ul.options li a.signup').size()).toBe(0);

    view.options.current_view = 'visualization';
    view.vis = new CartoTableMetadataFixture({ id: 'aaaa-bbbb-cccc-dddd', name: 'fake_2' }, configModel);
    view.render();

    expect(view.$('ul.options li a').size()).toBe(1);
    expect(view.$('ul.options li a.account').size()).toBe(1);
    expect(view.$('ul.options li a.login').size()).toBe(0);
    expect(view.$('ul.options li a.signup').size()).toBe(0);
  });
});

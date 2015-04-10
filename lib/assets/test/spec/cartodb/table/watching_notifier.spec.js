/**
 *  Watching notifier view specs
 */

describe("Watching notifier", function() {

  describe("Model", function() {
    var view, vis, model, user;

    beforeEach(function() {
      vis = new cdb.admin.Visualization({
        name:     "test_vis",
        privacy:  "PUBLIC",
        type:     "table",
        permission: {
          owner: { username: 'test', avatar_url: 'http://test.com', id: 'test'},
          acl: []
        }
      });
      user = TestUtil.createUser();
      model = new cdb.admin.WatchingNotifierModel({}, { vis: vis });
    });

    afterEach(function() {
      model.destroyCheck()
    });

    it('should check users when acl has any item', function() {
      // We can't check any other bind due to the problem
      // with jasmine :(
      vis.permission.setPermission(user, 'rw');
      spyOn(model.vis.permission.acl,'size')
      model._checkPermissions();
      expect(model.vis.permission.acl.size).toHaveBeenCalled();
    });

    it('should check again when visualization id has changed and acl has any item', function() {
      spyOn(model, 'destroyCheck');
      vis.set('description', 'test');
      expect(model.destroyCheck).not.toHaveBeenCalled();
      vis.set('id', 'test');
      expect(model.destroyCheck).toHaveBeenCalled();
    });

    it('should destroy poll check when acl list is empty', function() {
      spyOn(model, 'destroyCheck');
      vis.permission.setPermission(user, 'rw');
      vis.set('id', 'test2');
      expect(model.destroyCheck).not.toHaveBeenCalled();
      vis.permission.removePermission(user, 'rw');
      vis.set('id', 'test1');
      expect(model.destroyCheck).toHaveBeenCalled();
    });

    it('should destroy poll check when visualization is derived type', function() {
      spyOn(model, 'destroyCheck');
      vis.permission.setPermission(user, 'rw');
      vis.set('id', 'test2');
      expect(model.destroyCheck).not.toHaveBeenCalled();
      vis.set('type', 'derived');
      vis.set('id', 'test1');
      expect(model.destroyCheck).toHaveBeenCalled();
    });
  })

  describe("View", function() {

    var view, vis, model, user;

    beforeEach(function() {
      vis = new cdb.admin.Visualization({
        name:     "test_vis",
        privacy:  "PUBLIC",
        type:     "derived",
        permission: {
          owner: { username: 'test', avatar_url: 'http://test.com', id: 'test'},
          acl: []
        }
      });
      user = TestUtil.createUser(); // staging20 is the username
      model = new cdb.admin.WatchingNotifierModel({}, { vis: vis });
      view = new cdb.admin.WatchingNotifierView({ model: model, user: user });
    });

    afterEach(function() {
      model.destroyCheck()
    });

    it('should render properly', function() {
      view.render();
      expect(view.$el.text().replace(/^\s+|\s+$/g, '')).toBe('0 people are also editing this dataset');
      expect(view.$el.hasClass('active')).toBeFalsy();
    });

    it('should change text when watcher users has changed', function() {
      view.render();
      expect(view.$el.text().replace(/^\s+|\s+$/g, '')).toBe('0 people are also editing this dataset');
      model.set('users', ['test', 'test2', 'test3']);
      expect(view.$el.hasClass('active')).toBeTruthy();
      expect(view.$el.text().replace(/^\s+|\s+$/g, '')).toBe('3 people are also editing this dataset');
      model.set('users', ['test']);
      expect(view.$el.text().replace(/^\s+|\s+$/g, '')).toBe('test is also editing this dataset');
    });

    it('should hide when watcher users is 0', function() {
      view.render();
      model.set('users', []);
      expect(view.$el.hasClass('active')).toBeFalsy();
    });

    it('should remove current user from users array', function() {
      view.render();
      model.set('users', ['staging20', 'test2', 'test3']);
      expect(view.$el.hasClass('active')).toBeTruthy();
      expect(view.$el.text().replace(/^\s+|\s+$/g, '')).toBe('2 people are also editing this dataset');
    });
  })

  
});

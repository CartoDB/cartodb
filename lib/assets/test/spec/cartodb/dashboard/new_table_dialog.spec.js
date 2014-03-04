
  describe("New table dialog", function() {

    var view, server, user;

    beforeEach(function() {
      user = TestUtil.createUser('jam');

      window.user_data = user.toJSON();
      window.config = {};

      // Create a new dialog
      view = new cdb.admin.CreateTableDialog({
        tables: TestUtil.createTable('test1'),
        files: null,
        url: null,
        user: TestUtil.createUser('jam')
      });
      
      server = sinon.fakeServer.create();
    });

    it("should appear properly", function() {
      cdb.config.set('dropbox_api_key', 'd');
      cdb.config.set('gdrive_app_id', 'g');

      view.render();

      expect(view.$('.dialog-tabs li.option').length).toBe(2);
      expect(view.$('.dialog-tabs li.option.active').length).toBe(1);
      expect(view.$('.upload-panes').length).toBe(1);
      expect(view.$('.upload-panes > div').length).toBe(2);
      expect(view.$('.ok').hasClass('disabled')).toBeTruthy();
    });

    it("should change tab properly", function() {
      view.render();
      view.$('.dialog-tabs li.option:eq(1) a').click();
      expect(view.$('.dialog-tabs li.option.active').length).toBe(1);
      expect(view.$('.dialog-tabs li.option.active a').text()).toBe('Start from scratch');
      expect(view.$('.ok').hasClass('disabled')).toBeFalsy();
      expect(view.$('.ok').text()).toBe('Create empty table');
    });

    it("should start creating process", function() {
      view.render();
      spyOn(view, '_createTable');
      view.$('.dialog-tabs li.option:eq(1) a').click();
      view.$('.ok').click();

      expect(view.$('.upload-progress.creating.active').length).toBe(1);
      expect(view.$('.upload-progress.creating.active > p:eq(0)').text()).toBe('Creating your table...');
      expect(view.$('.head h3:eq(0)').text()).toBe('Creating your table...');
      expect(view.$('.ok').text()).toBe('Create table');
      expect(view.$('.ok').hasClass('disabled')).toBeTruthy();

      expect(view._createTable).toHaveBeenCalled();
    });

  })

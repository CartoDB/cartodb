describe('cdb.admin.Group', function() {
  describe('when given no attrs', function() {
    beforeEach(function() {
      this.group = new cdb.admin.Group();
    });

    it('should create an empty users collection', function() {
      expect(this.group.users).toBeDefined();
      expect(this.group.users.length).toEqual(0);
    });
  });

  describe('when given some attrs', function() {
    beforeEach(function() {
      this.group = new cdb.admin.Group({
        id: 'g1',
        display_name: 'My Group',
        name: 'my_group',
        users: [{
          id: 'u1',
          username: 'pepe'
        }]
      });
    });

    it('should create a users collection from given members collection', function() {
      expect(this.group.users).toBeDefined();
      expect(this.group.users.length).toEqual(1);
      expect(this.group.users.first().get('username')).toEqual('pepe');
      expect(this.group.users.group).toBe(this.group);
    });
  });
});

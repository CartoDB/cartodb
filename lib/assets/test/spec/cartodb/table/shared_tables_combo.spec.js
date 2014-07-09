
  describe("Shared tables selector", function() {

    var view, vis, tables, user;

    beforeEach(function() {
      tables = new cdb.admin.Visualizations({ type: 'table' });
      vis = new cdb.admin.Visualization(generateVisData(
        [
          { type: 'user', entity: { id: 'uuid', username: 'u1' }, access: 'r' },
          { type: 'user', entity: { id: 'uuid2', username: 'u2' }, access: 'rw' }
        ]
      ));
      user = TestUtil.createUser('staging20');
      user.organization = new cdb.admin.Organization({ id: 'ja', users: [1,2,3] })
      view = new cdb.admin.SharedTablesCombo({
        model:  tables,
        vis:    vis,
        user:   user
      });
    });


    // it("should show a combo without tables to select", function() {
    //   view.render();

      // tables.reset([ generateTableData(1, [], { username: 'staging20', avatar_url: 'http://test.com', id: 2 }) ]);

      // console.log(vis,tables);
      // expect(view.getSelected()).toBe(null);
    // });



    function generateVisData(acl) {
      return {
        id:               "1",
        name:             "test_vis",
        description:      "des",
        privacy:          "PUBLIC",
        table:            { id: 396, name: "untitled_table_9", privacy: "PRIVATE", row_count: 0, size: 16384, updated_at: "2013-03-04T18:09:34+01:00" },
        type:             "derived",
        permission: {
          owner:          { username: 'staging20', avatar_url: 'http://test.com', id: 2 },
          acl:            acl || []
        }
      }
    }

    function generateTableData(id, acl, owner) {
      return {
        id:         id,
        name:       id + "test_table",
        type:       "table",
        privacy:    "PUBLIC",
        table: {
          id:       id + 85,
          name:     id + "test_table",
          privacy:  "PUBLIC",
          permission: {
            owner:    owner || { username: 'staging20', avatar_url: 'http://test.com', id: 2 },
            acl:      acl || []
          }
        },
        permission: {
          owner:    owner || { username: 'staging20', avatar_url: 'http://test.com', id: 2 },
          acl:      acl || []
        }
      }
    }
  })

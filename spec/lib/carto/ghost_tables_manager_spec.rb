# encoding: utf-8

require_relative '../../spec_helper_min.rb'
require_relative '../../../lib/carto/ghost_tables_manager'
require 'helpers/database_connection_helper'

module Carto
  describe GhostTablesManager do
    include DatabaseConnectionHelper
    before(:all) do
      @sequel_user = FactoryGirl.create(:valid_user)
      @user = Carto::User.find(@sequel_user.id)
      @ghost_tables_manager = Carto::GhostTablesManager.new(@user.id)
    end

    before(:each) do
      bypass_named_maps
      CartoDB::Logger.expects(:error).never
    end

    after(:all) do
      ::User[@user.id].destroy
    end

    def run_in_user_database(query)
      ::User[@user.id].in_database.run(query)
    end

    it 'should be consistent when no new/renamed/dropped tables' do
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true
    end

    it 'should not run sync when more than MAX_TABLES_FOR_SYNC_RUN need to be linked' do
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @ghost_tables_manager.stubs(:find_dropped_tables)
                           .returns([*1..Carto::GhostTablesManager::MAX_TABLES_FOR_SYNC_RUN])

      @ghost_tables_manager.send(:should_run_synchronously?).should be_false
    end

    it 'should not run sync when more than MAX_TABLES_FOR_SYNC_RUN need to be linked including new tables' do
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @ghost_tables_manager.stubs(:find_dropped_tables)
                           .returns(['manolo'])
      @ghost_tables_manager.stubs(:find_dropped_tables)
                           .returns([*1..Carto::GhostTablesManager::MAX_TABLES_FOR_SYNC_RUN])

      @ghost_tables_manager.send(:should_run_synchronously?).should be_false
    end

    it 'should run sync when more than 0 but less than MAX_TABLES_FOR_SYNC_RUN need to be linked' do
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @ghost_tables_manager.stubs(:find_dropped_tables)
                           .returns([*1..(Carto::GhostTablesManager::MAX_TABLES_FOR_SYNC_RUN - 1)])

      @ghost_tables_manager.send(:should_run_synchronously?).should be_true
    end

    it 'should not run sync when no tables are stale or dropped' do
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @ghost_tables_manager.stubs(:find_dropped_tables)
                           .returns([])
      @ghost_tables_manager.stubs(:find_new_tables)
                           .returns([*1..Carto::GhostTablesManager::MAX_TABLES_FOR_SYNC_RUN])

      @ghost_tables_manager.send(:should_run_synchronously?).should be_false
    end

    it 'should not run when no tables are changed with tables detected as raster and non-raster' do
      raster_tables = [Carto::TableFacade.new(123, 'manolito', @user.id)]
      @ghost_tables_manager.stubs(:fetch_non_raster_cartodbfied_tables).returns(raster_tables)
      @ghost_tables_manager.stubs(:fetch_raster_tables).returns(raster_tables)
      @ghost_tables_manager.stubs(:fetch_user_tables).returns(raster_tables)

      @ghost_tables_manager.send(:user_tables_synced_with_db?).should be_true
    end

    it 'should link sql created table, relink sql renamed tables and unlink sql dropped tables' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTables, @user.id).never

      @ghost_tables_manager.link_ghost_tables_synchronously
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @user.tables.count.should eq 1
      @user.tables.first.name.should == 'manoloescobar'

      run_in_user_database(%{
        ALTER TABLE manoloescobar RENAME TO escobar;
      })

      @user.tables.count.should eq 1
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false

      @ghost_tables_manager.link_ghost_tables_synchronously
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @user.tables.count.should eq 1
      @user.tables.first.name.should == 'escobar'

      run_in_user_database(%{
        DROP TABLE escobar;
      })

      @user.tables.count.should eq 1
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false
      @ghost_tables_manager.link_ghost_tables_synchronously

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true
    end

    it 'should link sql created table using regular api key with create permissions' do
      grants = [
        {
          type: 'apis',
          apis: ['maps', 'sql']
        },
        {
          type: "database",
          schemas: [
            {
              name: "#{@user.database_schema}",
              permissions: ['create']
            }
          ]
        }
      ]
      api_key = @user.api_keys.create_regular_key!(name: 'ghost_tables', grants: grants)
      with_connection_from_api_key(api_key) do |connection|
        sql = %{
          CREATE TABLE test_table ("description" text);
          SELECT * FROM CDB_CartodbfyTable('test_table');
        }
        connection.execute(sql)
      end

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTables, @user.id).never

      @ghost_tables_manager.link_ghost_tables_synchronously
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @user.tables.count.should eq 1
      @user.tables.first.name.should == 'test_table'

      with_connection_from_api_key(api_key) do |connection|
        connection.execute('DROP TABLE test_table')
      end

      @user.tables.count.should eq 1
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false
      @ghost_tables_manager.link_ghost_tables_synchronously

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      api_key.destroy
    end

    it 'should link sql created table using oauth_app api key with create permissions' do
      scopes = ['offline', 'user:profile', 'schemas:c']
      app = FactoryGirl.create(:oauth_app, user: @user)
      oau = OauthAppUser.create!(user: @user, oauth_app: app, scopes: scopes)
      refresh_token = oau.oauth_refresh_tokens.create!(scopes: scopes)
      access_token = refresh_token.exchange!(requested_scopes: scopes)[0]

      with_connection_from_api_key(access_token.api_key) do |connection|
        sql = %{
          CREATE TABLE test_table ("description" text);
          SELECT * FROM CDB_CartodbfyTable('test_table');
        }
        connection.execute(sql)
      end

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTables, @user.id).never

      @ghost_tables_manager.link_ghost_tables_synchronously
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @user.tables.count.should eq 1
      @user.tables.first.name.should == 'test_table'

      with_connection_from_api_key(access_token.api_key) do |connection|
        connection.execute('DROP TABLE test_table')
      end

      @user.tables.count.should eq 1
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false
      @ghost_tables_manager.link_ghost_tables_synchronously

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      oau.destroy
      app.destroy
    end

    it 'should not link non cartodbyfied tables' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
      })

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @ghost_tables_manager.link_ghost_tables_synchronously

      run_in_user_database(%{
        DROP TABLE manoloescobar;
      })

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true
    end

    it 'should link raster tables' do
      run_in_user_database(%{
        CREATE TABLE manolo_raster ("cartodb_id" uuid, "the_raster_webmercator" raster);
        CREATE TRIGGER test_quota_per_row
          BEFORE INSERT OR UPDATE
          ON manolo_raster
          FOR EACH ROW
          EXECUTE PROCEDURE cdb_checkquota('0.001', '-1', 'public');
      })

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false

      @ghost_tables_manager.link_ghost_tables_synchronously

      @user.tables.count.should eq 1
      @user.tables.first.name.should == 'manolo_raster'

      run_in_user_database(%{
        DROP TABLE manolo_raster;
      })

      @user.tables.count.should eq 1
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false
      @ghost_tables_manager.link_ghost_tables_synchronously

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true
    end

    it 'should regenerate user tables with bad table_ids' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTables, @user.id).never

      @ghost_tables_manager.link_ghost_tables_synchronously
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @user.tables.count.should eq 1
      @user.tables.first.name.should == 'manoloescobar'

      user_table = @user.tables.first
      original_oid = user_table.table_id

      user_table.table_id = original_oid + 1
      user_table.save

      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false
      @ghost_tables_manager.link_ghost_tables_synchronously

      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @user.tables.count.should eq 1
      @user.tables.first.name.should == 'manoloescobar'

      @user.tables.first.table_id.should == original_oid

      run_in_user_database(%{
        DROP TABLE manoloescobar;
      })

      @user.tables.count.should eq 1
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false
      @ghost_tables_manager.link_ghost_tables_synchronously

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true
    end

    it 'should preseve maps in drop create scenarios' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTables, @user.id).never

      @ghost_tables_manager.link_ghost_tables_synchronously
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @user.tables.count.should eq 1

      original_user_table = @user.tables.first
      original_user_table.name.should == 'manoloescobar'

      original_user_table_id = original_user_table.id
      original_map_id = original_user_table.map.id

      run_in_user_database(%{
        DROP TABLE manoloescobar;
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      @user.tables.count.should eq 1
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false

      @ghost_tables_manager.link_ghost_tables_synchronously
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true

      @user.tables.count.should eq 1

      @user.tables.first.id.should == original_user_table_id
      @user.tables.first.map.id.should == original_map_id

      run_in_user_database(%{
        DROP TABLE manoloescobar;
      })

      @user.tables.count.should eq 1
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false
      @ghost_tables_manager.link_ghost_tables_synchronously

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true
    end

    it 'perform a successfully ghost tables execution when is called from LinkGhostTablesByUsername' do
      Carto::GhostTablesManager.expects(:new).with(@user.id).returns(@ghost_tables_manager).once
      @ghost_tables_manager.expects(:link_ghost_tables_synchronously).once
      ::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTablesByUsername.perform(@user.username)
    end

    it 'should call the rerun_func and execute sync twice becuase other worker tried to get the lock' do
      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true
      main = Thread.new do
        run_in_user_database(%{
          CREATE TABLE manoloescobar ("description" text);
          SELECT * FROM CDB_CartodbfyTable('manoloescobar');
        })
        rerun_func = lambda do
          Carto::GhostTablesManager.new(@user.id).send(:sync)
        end
        gtm = Carto::GhostTablesManager.new(@user.id)
        gtm.get_bolt.run_locked(rerun_func: rerun_func) do
          sleep(1)
          Carto::GhostTablesManager.new(@user.id).send(:sync)
        end
      end
      thr = Thread.new do
        run_in_user_database(%{
          CREATE TABLE manoloescobar2 ("description" text);
          SELECT * FROM CDB_CartodbfyTable('manoloescobar2');
        })
        Carto::GhostTablesManager.new(@user.id).get_bolt.run_locked {}
      end
      thr.join
      main.join
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true
      @user.tables.count.should eq 2

      run_in_user_database(%{
        DROP TABLE manoloescobar;
        DROP TABLE manoloescobar2;
      })

      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false
      @ghost_tables_manager.link_ghost_tables_synchronously
      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_true
    end
  end
end

require_relative '../../spec_helper_min.rb'
require_relative '../../../lib/carto/ghost_tables_manager'
require 'helpers/database_connection_helper'

module Carto

  describe GhostTablesManager do
    include DatabaseConnectionHelper
    include Carto::Factories::Visualizations

    let(:sequel_user) { create(:valid_user) }
    let!(:user) { Carto::User.find(sequel_user.id) }
    let!(:ghost_tables_manager) { Carto::GhostTablesManager.new(user.id) }

    before(:each) do
      bypass_named_maps
      Rails.logger.expects(:error).never
    end

    after { Carto::User.destroy_all }

    def run_in_user_database(query)
      sequel_user.in_database.run(query)
    end

    it 'should be consistent when no new/renamed/dropped tables' do
      ghost_tables_manager.expects(:link_ghost_tables_synchronously).never
      ghost_tables_manager.expects(:link_ghost_tables_asynchronously).never
      ghost_tables_manager.send(:link_ghost_tables)
    end

    it 'should not run sync when the user has more than MAX_USERTABLES_FOR_SYNC_CHECK tables' do
      # We simulate the deletion of 2 tables, which would trigger a sync run in a small user
      ghost_tables_manager.stubs(:fetch_user_tables)
                           .returns([*1..Carto::GhostTablesManager::MAX_USERTABLES_FOR_SYNC_CHECK + 2].map do |id|
                                        Carto::TableFacade.new(id, "name #{id}", user.id)
                                    end
                                   )

      ghost_tables_manager.stubs(:fetch_cartodbfied_tables)
                           .returns([*1..Carto::GhostTablesManager::MAX_USERTABLES_FOR_SYNC_CHECK].map do |id|
                                        Carto::TableFacade.new(id, "name #{id}", user.id)
                                    end
                                   )
      ghost_tables_manager.expects(:link_ghost_tables_asynchronously).once
      # In big databases, `:should_run_synchronously?` is expensive so we want to ensure it isn't called at all
      ghost_tables_manager.expects(:should_run_synchronously?).never

      ghost_tables_manager.send(:link_ghost_tables)
    end

    it 'should not run sync when more than MAX_TABLES_FOR_SYNC_RUN need to be linked' do
      regenerated_tables = []
      renamed_tables = []
      new_tables = []
      dropped_tables = [*1..Carto::GhostTablesManager::MAX_TABLES_FOR_SYNC_RUN]
      ghost_tables_manager.stubs(:fetch_altered_tables)
                           .returns([regenerated_tables, renamed_tables, new_tables, dropped_tables])

      ghost_tables_manager.expects(:link_ghost_tables_synchronously).never
      ghost_tables_manager.expects(:link_ghost_tables_asynchronously).once
      ghost_tables_manager.send(:link_ghost_tables)
    end

    it 'should not run sync when more than MAX_TABLES_FOR_SYNC_RUN need to be linked including new tables' do
      regenerated_tables = []
      renamed_tables = []
      new_tables = [*1..Carto::GhostTablesManager::MAX_TABLES_FOR_SYNC_RUN - 2]
      dropped_tables = ['manolo', 'pepito']
      ghost_tables_manager.stubs(:fetch_altered_tables)
                           .returns([regenerated_tables, renamed_tables, new_tables, dropped_tables])

      ghost_tables_manager.expects(:link_ghost_tables_synchronously).never
      ghost_tables_manager.expects(:link_ghost_tables_asynchronously).once
      ghost_tables_manager.send(:link_ghost_tables)
    end

    it 'should run sync when more than 0 but less than MAX_TABLES_FOR_SYNC_RUN need to be linked' do
      regenerated_tables = []
      renamed_tables = []
      new_tables = []
      dropped_tables = [*1..Carto::GhostTablesManager::MAX_TABLES_FOR_SYNC_RUN - 1]
      ghost_tables_manager.stubs(:fetch_altered_tables)
                           .returns([regenerated_tables, renamed_tables, new_tables, dropped_tables])

      ghost_tables_manager.expects(:link_ghost_tables_synchronously).once
      ghost_tables_manager.expects(:link_ghost_tables_asynchronously).never
      ghost_tables_manager.send(:link_ghost_tables)
    end

    it 'should not run sync when no tables are stale or dropped' do
      regenerated_tables = []
      renamed_tables = []
      new_tables = [*1..Carto::GhostTablesManager::MAX_TABLES_FOR_SYNC_RUN]
      dropped_tables = []
      ghost_tables_manager.stubs(:fetch_altered_tables)
                           .returns([regenerated_tables, renamed_tables, new_tables, dropped_tables])

      ghost_tables_manager.expects(:link_ghost_tables_synchronously).never
      ghost_tables_manager.expects(:link_ghost_tables_asynchronously).once
      ghost_tables_manager.send(:link_ghost_tables)
    end

    it 'should link sql created table, relink sql renamed tables and unlink sql dropped tables' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTablesByUsername, user.username).never

      ghost_tables_manager.link_ghost_tables_synchronously
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      user.tables.count.should eq 1
      user.tables.first.name.should == 'manoloescobar'

      run_in_user_database(%{
        ALTER TABLE manoloescobar RENAME TO escobar;
      })

      user.tables.count.should eq 1
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false

      ghost_tables_manager.link_ghost_tables_synchronously
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      user.tables.count.should eq 1
      user.tables.first.name.should == 'escobar'

      run_in_user_database(%{
        DROP TABLE escobar;
      })

      user.tables.count.should eq 1
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false
      ghost_tables_manager.link_ghost_tables_synchronously

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true
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
              name: "#{user.database_schema}",
              permissions: ['create']
            }
          ]
        }
      ]
      api_key = user.api_keys.create_regular_key!(name: 'ghost_tables', grants: grants)
      with_connection_from_api_key(api_key) do |connection|
        sql = %{
          CREATE TABLE test_table ("description" text);
          SELECT * FROM CDB_CartodbfyTable('test_table');
        }
        connection.execute(sql)
      end

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTablesByUsername, user.username).never

      ghost_tables_manager.link_ghost_tables_synchronously
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      user.tables.count.should eq 1
      user.tables.first.name.should == 'test_table'

      with_connection_from_api_key(api_key) do |connection|
        connection.execute('DROP TABLE test_table')
      end

      user.tables.count.should eq 1
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false
      ghost_tables_manager.link_ghost_tables_synchronously

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      api_key.destroy
    end

    it 'should link sql created table using oauth_app api key with create permissions' do
      scopes = ['offline', 'user:profile', 'schemas:c']
      app = create(:oauth_app, user: user)
      oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes)
      refresh_token = oau.oauth_refresh_tokens.create!(scopes: scopes)
      access_token = refresh_token.exchange!(requested_scopes: scopes)[0]

      with_connection_from_api_key(access_token.api_key) do |connection|
        sql = %{
          CREATE TABLE test_table ("description" text);
          SELECT * FROM CDB_CartodbfyTable('test_table');
        }
        connection.execute(sql)
      end

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTablesByUsername, user.username).never

      ghost_tables_manager.link_ghost_tables_synchronously
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      user.tables.count.should eq 1
      user.tables.first.name.should == 'test_table'

      with_connection_from_api_key(access_token.api_key) do |connection|
        connection.execute('DROP TABLE test_table')
      end

      user.tables.count.should eq 1
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false
      ghost_tables_manager.link_ghost_tables_synchronously

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      oau.destroy
      app.destroy
    end

    it 'should not link non cartodbyfied tables' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
      })

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      ghost_tables_manager.link_ghost_tables_synchronously

      run_in_user_database(%{
        DROP TABLE manoloescobar;
      })

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true
    end

    it 'should link raster tables' do
      next unless user.db_service.tables_effective.include?('raster_overviews')

      run_in_user_database(%{
        CREATE TABLE manolo_raster ("cartodb_id" uuid, "the_raster_webmercator" raster);
        CREATE TRIGGER test_quota_per_row
          BEFORE INSERT OR UPDATE
          ON manolo_raster
          FOR EACH ROW
          EXECUTE PROCEDURE cdb_checkquota('0.001', '-1', 'public');
      })

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false

      ghost_tables_manager.link_ghost_tables_synchronously

      user.tables.count.should eq 1
      user.tables.first.name.should == 'manolo_raster'

      run_in_user_database(%{
        DROP TABLE manolo_raster;
      })

      user.tables.count.should eq 1
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false
      ghost_tables_manager.link_ghost_tables_synchronously

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true
    end

    it 'should regenerate user tables with bad table_ids' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTablesByUsername, user.username).never

      ghost_tables_manager.link_ghost_tables_synchronously
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      user.tables.count.should eq 1
      user.tables.first.name.should == 'manoloescobar'

      user_table = user.tables.first
      original_oid = user_table.table_id

      user_table.table_id = original_oid + 1
      user_table.save

      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false
      ghost_tables_manager.link_ghost_tables_synchronously

      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      user.tables.count.should eq 1
      user.tables.first.name.should == 'manoloescobar'

      user.tables.first.table_id.should == original_oid

      run_in_user_database(%{
        DROP TABLE manoloescobar;
      })

      user.tables.count.should eq 1
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false
      ghost_tables_manager.link_ghost_tables_synchronously

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true
    end

    it 'should preseve maps in drop create scenarios' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTablesByUsername, user.username).never

      ghost_tables_manager.link_ghost_tables_synchronously
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      user.tables.count.should eq 1

      original_user_table = user.tables.first
      original_user_table.name.should == 'manoloescobar'

      original_user_table_id = original_user_table.id
      original_map_id = original_user_table.map.id

      run_in_user_database(%{
        DROP TABLE manoloescobar;
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      user.tables.count.should eq 1
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false

      ghost_tables_manager.link_ghost_tables_synchronously
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true

      user.tables.count.should eq 1

      user.tables.first.id.should == original_user_table_id
      user.tables.first.map.id.should == original_map_id

      run_in_user_database(%{
        DROP TABLE manoloescobar;
      })

      user.tables.count.should eq 1
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false
      ghost_tables_manager.link_ghost_tables_synchronously

      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true
    end

    it 'perform a successfully ghost tables execution when is called from LinkGhostTablesByUsername' do
      Carto::GhostTablesManager.expects(:new).with(user.id).returns(ghost_tables_manager).once
      ghost_tables_manager.expects(:link_ghost_tables_synchronously).once
      ::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTablesByUsername.perform(user.username)
    end

    it 'perform a successfully ghost tables execution when is called from LinkGhostTables' do
      Carto::GhostTablesManager.expects(:new).with(user.id).returns(ghost_tables_manager).once
      ghost_tables_manager.expects(:link_ghost_tables_synchronously).once
      ::Resque::UserDBJobs::UserDBMaintenance::LinkGhostTables.perform(user.id)
    end

    it 'should call the fail_function and execute sync twice because other worker tried to get the lock' do
      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true
      main = Thread.new do
        run_in_user_database(%{
          CREATE TABLE manoloescobar ("description" text);
          SELECT * FROM CDB_CartodbfyTable('manoloescobar');
        })
        rerun_func = lambda do
          Carto::GhostTablesManager.new(user.id).send(:sync)
        end
        gtm = Carto::GhostTablesManager.new(user.id)
        gtm.get_bolt.run_locked(fail_function: rerun_func) do
          sleep(1)
          Carto::GhostTablesManager.new(user.id).send(:sync)
        end
      end
      thr = Thread.new do
        run_in_user_database(%{
          CREATE TABLE manoloescobar2 ("description" text);
          SELECT * FROM CDB_CartodbfyTable('manoloescobar2');
        })
        Carto::GhostTablesManager.new(user.id).get_bolt.run_locked {}
      end
      thr.join
      main.join
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true
      user.tables.count.should eq 2

      run_in_user_database(%{
        DROP TABLE manoloescobar;
        DROP TABLE manoloescobar2;
      })

      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_false
      ghost_tables_manager.link_ghost_tables_synchronously
      user.tables.count.should eq 0
      ghost_tables_manager.instance_eval { fetch_user_tables_synced_with_db? }.should be_true
    end

    it 'should backup visualizations before dropping a table' do
      _, _, table_visualization, map_visualization = create_full_visualization(user)

      expect(Carto::VisualizationBackup.count).to eq(0)

      run_in_user_database("ALTER TABLE #{table_visualization.user_table.name} DROP COLUMN cartodb_id")
      ghost_tables_manager.link_ghost_tables_synchronously

      expect(table_visualization.backups.first[:export][:visualization][:user_table]).to be_present
      expect(table_visualization.backups.first[:export][:visualization][:type]).to eq('table')

      expect(map_visualization.backups.first[:export][:visualization][:user_table]).to be_nil
      expect(map_visualization.backups.first[:export][:visualization][:type]).to eq('derived')
    end
  end

end

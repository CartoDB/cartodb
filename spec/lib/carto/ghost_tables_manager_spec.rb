# encoding utf-8

require_relative '../../spec_helper_min.rb'
require_relative '../../../lib/carto/ghost_tables_manager'

module Carto
  describe GhostTablesManager do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)

      @ghost_tables_manager = Carto::GhostTablesManager.new(@user.id)
    end

    before(:each) do
      bypass_named_maps
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

    it 'should link sql created table, relink sql renamed tables and unlink sql dropped tables' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      @user.tables.count.should eq 0
      @ghost_tables_manager.instance_eval { user_tables_synced_with_db? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::SyncTables::LinkGhostTables, @user.id).never

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

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::SyncTables::LinkGhostTables, @user.id).never

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

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::SyncTables::LinkGhostTables, @user.id).never

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
  end
end

# encoding utf-8

require_relative '../../spec_helper_min.rb'
require_relative '../../../lib/carto/ghost_tables_manager'

module Carto
  describe GhostTablesManager do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)
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
      Carto::GhostTablesManager.new(@user.id).instance_eval { consistent? }.should be_true
    end

    it 'should link sql created table, relink sql renamed tables and unlink sql dropped tables' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
        SELECT * FROM CDB_CartodbfyTable('manoloescobar');
      })

      @user.tables.count.should eq 0
      Carto::GhostTablesManager.new(@user.id).instance_eval { consistent? }.should be_false

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::SyncTables::LinkGhostTables, @user.id).never

      Carto::GhostTablesManager.new(@user.id).link_ghost_tables_sync
      Carto::GhostTablesManager.new(@user.id).instance_eval { consistent? }.should be_true

      @user.tables.count.should eq 1
      @user.tables.first.name.should == 'manoloescobar'

      run_in_user_database(%{
        ALTER TABLE manoloescobar RENAME TO escobar;
      })

      @user.tables.count.should eq 1
      Carto::GhostTablesManager.new(@user.id).instance_eval { consistent? }.should be_false

      Carto::GhostTablesManager.new(@user.id).link_ghost_tables_sync
      Carto::GhostTablesManager.new(@user.id).instance_eval { consistent? }.should be_true

      @user.tables.count.should eq 1
      @user.tables.first.name.should == 'escobar'

      run_in_user_database(%{
        DROP TABLE escobar;
      })

      @user.tables.count.should eq 1
      Carto::GhostTablesManager.new(@user.id).instance_eval { consistent? }.should be_false

      Carto::GhostTablesManager.new(@user.id).link_ghost_tables_sync
      Carto::GhostTablesManager.new(@user.id).instance_eval { consistent? }.should be_true

      @user.tables.count.should eq 0
    end

    it 'should not link non cartodbyfied tables' do
      run_in_user_database(%{
        CREATE TABLE manoloescobar ("description" text);
      })

      @user.tables.count.should eq 0
      Carto::GhostTablesManager.new(@user.id).instance_eval { consistent? }.should be_true

      run_in_user_database(%{
        DROP TABLE manoloescobar;
      })

      @user.tables.count.should eq 0
      Carto::GhostTablesManager.new(@user.id).instance_eval { consistent? }.should be_true
    end
  end
end

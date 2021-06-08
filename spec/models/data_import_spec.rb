require_relative '../spec_helper'
require_relative '../helpers/file_server_helper'
require_relative 'data_import_shared_examples'
require_relative '../../lib/carto/ghost_tables_manager'

describe DataImport do
  let(:data_import_class) { ::DataImport }
  it_behaves_like 'DataImport model'

  before(:each) do
    @user = create_user
    bypass_named_maps
    @table = create_table(user_id: @user.id)
  end

  after(:each) do
    @user.destroy
  end

  after(:all) do
    bypass_named_maps
    @user.try(:destroy)
  end

  it "raises an 1014 error when strategy is set to skip and there's already a table with that name" do
    table1 = create_table(user_id: @user.id)
    table1.insert_row!(name: 1.0)
    table1.insert_row!(name: 2.0)
    query = "select * from #{table1.name}"
    data_import = DataImport.create(
      user_id: @user.id,
      table_name: 'target_table',
      from_query: query
    )
    data_import.run_import!
    data_import.state.should eq 'complete'
    data_import = DataImport.create(
      user_id: @user.id,
      table_name: 'target_table',
      from_query: query,
      collision_strategy: 'skip'
    )

    data_import.run_import!

    data_import.state.should eq 'complete'
    data_import.error_code.should eq 1022
  end

  it 'raises an 8004 error when merging tables
  through columns with different types' do
    table1 = create_table(user_id: @user.id)
    table2 = create_table(user_id: @user.id)

    table1.modify_column!(name: 'name', type: 'double precision')
    table1.insert_row!(name: 1.0)
    table2.insert_row!(name: '1')

    merge_query = %(
      SELECT #{table2.name}.the_geom,
              #{table2.name}.description,
              #{table2.name}.name,
              #{table1.name}.the_geom AS #{table1.name}_the_geom,
              #{table1.name}.description AS #{table1.name}_description,
              #{table1.name}.name AS #{table1.name}_name
      FROM #{table2.name} FULL OUTER JOIN #{table1.name}
      ON #{table2.name}.name = #{table1.name}.name
    )
    data_import = DataImport.create(
      user_id:  @user.id,
      table_name: "merged_table",
      from_query: merge_query
    )
    data_import.run_import!
    data_import.error_code.should == 8004
  end

  it 'raises a meaningful error if cartodb_id is not valid' do
    Table.any_instance.stubs(:cartodbfy).raises(CartoDB::CartoDBfyInvalidID)
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: fake_data_path('clubbing.csv'),
      updated_at: Time.now
    )

    data_import.run_import!
    data_import.error_code.should == 2011
  end

  it 'should overwrite dataset if collision_strategy is set to overwrite' do
    carto_user = Carto::User.find(@user.id)
    carto_user.visualizations.count.should eq 1

    data_import = create_import(overwrite: false, truncated: false)
    data_import.run_import!
    carto_user.reload
    carto_user.visualizations.count.should eq 2
    data_import.state.should eq 'complete'
    data_import.table_name.should eq 'walmart_latlon'
    data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 3176
    user_tables_should_be_registered

    data_import = create_import(overwrite: false, truncated: false)
    data_import.run_import!
    carto_user.reload
    carto_user.visualizations.count.should eq 3
    data_import.state.should eq 'complete'
    data_import.table_name.should eq 'walmart_latlon_1'
    data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 3176
    user_tables_should_be_registered

    data_import = create_import(overwrite: true, truncated: true)
    data_import.run_import!
    carto_user.reload
    carto_user.visualizations.count.should eq 3
    data_import.state.should eq 'complete'
    data_import.table_name.should eq 'walmart_latlon'
    data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 2
    user_tables_should_be_registered
  end

  it 'should overwrite dataset with query if collision_strategy is set to overwrite' do
    # overwriting from a sql is a different case needs to be tackled -> https://github.com/CartoDB/cartodb/issues/13139
    carto_user = Carto::User.find(@user.id)
    carto_user.visualizations.count.should eq 1

    data_import = create_import(overwrite: false, truncated: false)
    data_import.run_import!
    carto_user.reload
    carto_user.visualizations.count.should eq 2
    data_import.state.should eq 'complete'
    data_import.table_name.should eq 'walmart_latlon'
    data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 3176
    user_tables_should_be_registered

    query = 'select * from walmart_latlon limit 1'
    data_import = create_import_from_query(overwrite: true, from_query: query)
    data_import.run_import!
    carto_user.reload
    carto_user.visualizations.count.should eq 2
    data_import.state.should eq 'complete'
    data_import.table_name.should eq 'walmart_latlon'
    data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 1
    user_tables_should_be_registered
  end

  it 'should raise an error if overwriting with non existent table in query' do
    data_import = create_import_from_query(
      overwrite: true,
      from_query: 'select * from walmart_latlon_wtf limit 1'
    )
    data_import.run_import!
    data_import.state.should eq 'failure'
    data_import.error_code.should eq 8003
    data_import.log.entries.should match(/relation.*does not exist/)
  end

  it 'should work with a query that contains a "non-valid URI scheme"' do
    data_import = create_import_from_query(
      overwrite: false,
      from_query: 'SELECT (1)::numeric'
    )
    data_import.run_import!
    data_import.state.should eq 'complete'
  end

  it 'should raise an exception if overwriting with missing data' do
    carto_user = Carto::User.find(@user.id)
    carto_user.visualizations.count.should eq 1

    data_import = create_import(overwrite: false, truncated: true)
    data_import.run_import!
    carto_user.reload
    carto_user.visualizations.count.should eq 2
    data_import.state.should eq 'complete'
    data_import.table_name.should eq 'walmart_latlon'
    data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 2
    user_tables_should_be_registered

    data_import = create_import(overwrite: true, truncated: true, incomplete_schema: true)
    expect { data_import.run_import! }.to raise_error(::CartoDB::Importer2::IncompatibleSchemas)
    data_import.log.entries.should match(/Exception: Incompatible Schemas/)
  end

  describe 'organization behaviour' do
    include_context 'organization with users helper'

    it 'should overwrite even in users with hyphens in the schema name' do
      carto_user = Carto::User.find(@org_user_owner.id)
      expect(carto_user.username).to include '-' # Fixture check

      data_import = create_import(user: @org_user_owner, overwrite: false, truncated: false)
      data_import.run_import!
      carto_user.reload
      carto_user.visualizations.count.should eq 1
      data_import.state.should eq 'complete'
      data_import.table_name.should eq 'walmart_latlon'
      data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 3176
      user_tables_should_be_registered

      data_import = create_import(user: @org_user_owner, overwrite: true, truncated: true)
      data_import.run_import!
      carto_user.reload
      carto_user.visualizations.count.should eq 1
      data_import.state.should eq 'complete'
      data_import.table_name.should eq 'walmart_latlon'
      data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 2
      user_tables_should_be_registered
    end
  end

  it 'should not raise exceptions if overwriting with more data' do
    carto_user = Carto::User.find(@user.id)
    carto_user.visualizations.count.should eq 1

    data_import = create_import(overwrite: false, truncated: true, incomplete_schema: true)
    data_import.run_import!
    carto_user.reload
    carto_user.visualizations.count.should eq 2
    data_import.state.should eq 'complete'
    data_import.table_name.should eq 'walmart_latlon'
    data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 2
    user_tables_should_be_registered

    data_import = create_import(overwrite: true, truncated: true, incomplete_schema: false)
    data_import.run_import!
    carto_user.reload
    carto_user.visualizations.count.should eq 2
    data_import.state.should eq 'complete'
    data_import.table_name.should eq 'walmart_latlon'
    data_import.user.in_database["select count(*) from #{data_import.table_name}"].all[0][:count].should eq 2
    user_tables_should_be_registered
  end

  def user_tables_should_be_registered
    Carto::GhostTablesManager.new(@user.id).fetch_user_tables_synced_with_db?.should eq(true), "Tables not properly registered"
  end

  def create_import(user: @user, overwrite:, truncated:, incomplete_schema: false)
    DataImport.create(
      user_id: user.id,
      data_source: Rails.root.join("spec/support/data/#{truncated ? 'truncated/' : ''}#{incomplete_schema ? 'incomplete_schema/' : ''}walmart_latlon.csv").to_s,
      data_type: "file",
      table_name: 'walmart_latlon',
      state: "pending",
      success: false,
      updated_at: Time.now,
      created_at: Time.now,
      original_url: Rails.root.join("spec/support/data/walmart_latlon.csv").to_s,
      cartodbfy_time: 0.0,
      collision_strategy: overwrite ? 'overwrite' : nil
    )
  end

  def create_import_from_query(user: @user, overwrite:, from_query: '')
    DataImport.create(
      user_id: user.id,
      data_source: from_query,
      from_query: from_query,
      data_type: "query",
      table_name: 'walmart_latlon',
      state: "pending",
      success: false,
      updated_at: Time.now,
      created_at: Time.now,
      original_url: Rails.root.join("spec/support/data/walmart_latlon.csv").to_s,
      cartodbfy_time: 0.0,
      collision_strategy: overwrite ? 'overwrite' : nil
    )
  end

  it 'raises a meaningful error if over storage quota' do
    previous_quota_in_bytes = @user.quota_in_bytes
    @user.quota_in_bytes = 0
    @user.save

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: fake_data_path('clubbing.csv'),
      updated_at: Time.now
    ).run_import!

    @user.quota_in_bytes = previous_quota_in_bytes
    @user.save
    data_import.error_code.should == 8001
  end

  it 'raises a meaningful error if over table quota' do
    previous_table_quota = @user.table_quota
    @user.table_quota = 0
    @user.save

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: fake_data_path('clubbing.csv'),
      updated_at: Time.now
    ).run_import!

    @user.table_quota = previous_table_quota
    @user.save

    data_import.error_code.should == 8002
  end

  it 'should allow to duplicate an existing table' do
    data_import = DataImport.create(
      user_id: @user.id,
      table_name: 'duplicated_table',
      updated_at: Time.now,
      table_copy: @table.name).run_import!
    data_import.data_type.should eq 'query'
    duplicated_table = ::UserTable.where(id: data_import.table_id).first
    duplicated_table.should_not be_nil
    duplicated_table.name.should be == 'duplicated_table'
  end

  it 'should allow to create a table from a query' do
    data_import_1 = DataImport.create(
      user_id: @user.id,
      data_source: fake_data_path('clubbing.csv'),
      updated_at: Time.now).run_import!
    data_import_1.state.should be == 'complete'

    data_import_2 = DataImport.create(
      user_id: @user.id,
      table_name: 'from_query',
      updated_at: Time.now,
      from_query: "SELECT * FROM #{data_import_1.table_name} LIMIT 5").run_import!
    data_import_2.state.should be == 'complete'
    data_import_2.data_type.should eq 'query'

    duplicated_table = ::UserTable.where(id: data_import_2.table_id).first
    duplicated_table.should_not be_nil
    duplicated_table.name.should be == 'from_query'
    duplicated_table.service.records[:rows].should have(5).items
  end

  it 'imports a simple file' do
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: fake_data_path('clubbing.csv'),
      updated_at: Time.now
    ).run_import!

    table = ::UserTable.where(id: data_import.table_id).first
    table.should_not be_nil
    table.name.should be == 'clubbing'
    table.service.records[:rows].should have(10).items
  end

  it 'imports a simple file with latlon' do
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: Rails.root.join('services/importer/spec/fixtures/csv_with_geojson.csv').to_s,
      updated_at: Time.now
    ).run_import!

    table = ::UserTable.where(id: data_import.table_id).first
    table.should_not be_nil
  end

  it 'imports a gpkg with no coordinate system' do
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: fake_data_path('no_coordinate_system_dataset.gpkg'),
      updated_at: Time.now
    ).run_import!

    table = ::UserTable.where(id: data_import.table_id).first
    table.should_not be_nil
    table.name.should be == 'no_coordinate_system_dataset'
    table.service.records[:rows].should have(1).items
  end

  it 'should allow to create a table from a url' do
    data_import = nil
    CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
    serve_file Rails.root.join('db/fake_data/clubbing.csv') do |url|
      data_import = DataImport.create(
        user_id: @user.id,
        data_source: url,
        updated_at: Time.now).run_import!
    end

    table = ::UserTable.where(id: data_import.table_id).first
    table.should_not be_nil
    table.name.should be == 'clubbing'
    table.service.records[:rows].should have(10).items
  end

  it 'updates synch_job state after success data import' do
    data_import = nil
    sync_job = create(:enqueued_sync)
    Carto::Synchronization.find(sync_job.id).state.should eq Carto::Synchronization::STATE_QUEUED
    CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
    serve_file Rails.root.join('db/fake_data/clubbing.csv') do |url|
      data_import = DataImport.create(
        user_id: @user.id,
        data_source: url,
        synchronization_id: sync_job.id,
        updated_at: Time.now
      ).run_import!
    end

    data_import.state.should eq DataImport::STATE_COMPLETE
    Carto::Synchronization.find(sync_job.id).state.should eq Carto::Synchronization::STATE_SUCCESS
  end

  it 'updates synch_job state after failed data import' do
    sync_job = create(:enqueued_sync)
    Carto::Synchronization.find(sync_job.id).state.should eq Carto::Synchronization::STATE_QUEUED

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: "http://localhost/foo.csv",
      synchronization_id: sync_job.id,
      updated_at: Time.now
    ).run_import!

    data_import.state.should eq DataImport::STATE_FAILURE
    Carto::Synchronization.find(sync_job.id).state.should eq Carto::Synchronization::STATE_FAILURE
  end

  it 'should allow to create a table from a url with params' do
    data_import = nil
    CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
    serve_file Rails.root.join('db/fake_data/clubbing.csv?param=wadus'),
               headers: { "content-type" => "text/plain" } do |url|
      data_import = DataImport.create(
        user_id: @user.id,
        data_source: url,
        updated_at: Time.now).run_import!
    end

    table = ::UserTable.where(id: data_import.table_id).first
    table.should_not be_nil
    table.name.should be == 'clubbing'
    table.service.records[:rows].should have(10).items
  end

  it "can create a table from a query selecting only the cartodb_id" do
    data_import_1 = DataImport.create(
      user_id: @user.id,
      data_source: fake_data_path('clubbing.csv'),
      updated_at: Time.now).run_import!
    data_import_1.state.should be == 'complete'

    data_import_2 = DataImport.create(
      user_id: @user.id,
      table_name: 'from_query',
      updated_at: Time.now,
      from_query: "SELECT cartodb_id FROM #{data_import_1.table_name} LIMIT 5").run_import!
    data_import_2.state.should be == 'complete'

    duplicated_table = ::UserTable.where(id: data_import_2.table_id).first
    duplicated_table.should_not be_nil
    duplicated_table.name.should be == 'from_query'
    duplicated_table.service.records[:rows].should have(5).items
  end

  it "should remove any uploaded files after deletion" do
    upload_path = FileUtils.mkdir_p Rails.root.join('public', 'uploads', 'test0000000000000000')
    file_path = File.join(upload_path, 'wadus.csv')
    FileUtils.cp Rails.root.join('db/fake_data/clubbing.csv'), file_path
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: file_path,
      updated_at: Time.now)

    data_import.destroy

    Dir.exists?(file_path).should be_false
  end

  it 'should add a common_data extra_option' do
    DataImport.any_instance.stubs(:from_common_data?).returns(true)
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: "http://127.0.0.1/foo.csv"
    )
    data_import.reload
    data_import.extra_options[:common_data].should eq true
  end

  it 'should know that the import is from common data' do
    Cartodb.with_config(common_data: { 'username' => 'mycommondata', 'host' => 'cartodb.wadus.com' }) do
      data_import = DataImport.create(
        user_id: @user.id,
        data_source: "http://mycommondata.cartodb.wadus.com/foo.csv"
      )
      data_import.from_common_data?.should eq true
    end
  end

  it 'should not consider a import as common data if common_data config does not exist' do
    Cartodb.with_config(common_data: nil) do
      data_import = DataImport.create(
        user_id: @user.id,
        data_source: "http://mycommondata.cartodb.wadus.com/foo.csv"
      )
      data_import.from_common_data?.should eq false
    end
  end

  it 'should not consider a import as common data if common_data config does not match with url' do
    Cartodb.with_config(common_data: { 'username' => 'mycommondata', 'host' => 'cartodb.wadus.com' }) do
      data_import = DataImport.create(
        user_id: @user.id,
        data_source: "http://mydatasource.cartodb.wadus.com/foo.csv"
      )
      data_import.from_common_data?.should eq false
    end
  end

  it 'mark as failure a stuck job' do
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: "http://mydatasource.cartodb.wadus.com/foo.csv",
      state: DataImport::STATE_STUCK
    )
    data_import.mark_as_failed_if_stuck!.should eq true
    data_import.success.should eq false
    data_import.error_code.should eq 6671

    data_import.mark_as_failed_if_stuck!.should eq false
  end

  describe 'arcgis connector' do
    after :each do
      CartoDB::Importer2::QueryBatcher.any_instance.unstub(:execute_update)
    end

    it 'should complete with a warning when the query batcher raises a timeout exception' do
      stub_arcgis_response_with_file(File.expand_path('spec/fixtures/arcgis_response_valid.json'))
      CartoDB::Importer2::QueryBatcher.any_instance
                                      .stubs(:execute_update)
                                      .raises(Sequel::DatabaseError, 'canceling statement due to statement timeout')

      data_import = DataImport.create(
        user_id:    @user.id,
        service_name: 'arcgis',
        service_item_id: 'https://wtf.com/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2'
      )
      data_import.run_import!
      data_import.state.should eq 'complete'
      data_import.log.entries.should include 'Error fixing geometries during import, skipped'
    end

    it 'should raise invalid data error when the query batcher raise any other exception' do
      stub_arcgis_response_with_file(File.expand_path('spec/fixtures/arcgis_response_valid.json'))
      CartoDB::Importer2::QueryBatcher.any_instance
                                      .stubs(:execute_update)
                                      .raises(Sequel::DatabaseError, 'GEOSisValid(): InterruptedException: Interrupted!')

      data_import = DataImport.create(
        user_id:    @user.id,
        service_name: 'arcgis',
        service_item_id: 'https://wtf.com/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2'
      )
      data_import.run_import!
      data_import.state.should eq 'failure'
      data_import.error_code.should eq 1012
    end

    it 'should import this supposed invalid dataset for ogr2ogr 2.1.1' do
      stub_arcgis_response_with_file(File.expand_path('spec/fixtures/arcgis_response_invalid.json'))

      data_import = DataImport.create(
        user_id:    @user.id,
        service_name: 'arcgis',
        service_item_id: 'https://wtf.com/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2'
      )
      data_import.run_import!
      data_import.state.should eq 'complete'
    end

    it 'fail with error 1020 if timeout' do
      Typhoeus::Response.any_instance.stubs(:timed_out?).returns(true)
      stub_arcgis_response_with_file(File.expand_path('spec/fixtures/arcgis_response_missing_ogc_fid.json'))

      data_import = DataImport.create(
        user_id:    @user.id,
        service_name: 'arcgis',
        service_item_id: 'https://wtf.com/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2'
      )
      data_import.run_import!
      data_import.state.should eq 'failure'
      data_import.error_code.should eq 1020
      Typhoeus::Response.unstub(:timed_out?)
    end

    it 'should import files with missing ogc_fid' do
      stub_arcgis_response_with_file(File.expand_path('spec/fixtures/arcgis_response_missing_ogc_fid.json'))

      data_import = DataImport.create(
        user_id:    @user.id,
        service_name: 'arcgis',
        service_item_id: 'https://wtf.com/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2'
      )
      data_import.run_import!
      data_import.state.should eq 'complete'
    end
  end

  describe 'log' do
    it 'is initialized to a Carto::Log instance' do
      data_import = DataImport.create(
        user_id: @user.id,
        data_source: "http://mydatasource.cartodb.wadus.com/foo.csv"
      )
      data_import.log.should be_instance_of Carto::Log
    end

    it 'allows messages to be appended' do
      data_import = DataImport.new(
        user_id:    @user.id,
        table_name: 'foo',
        from_query: 'bogus'
      )
      data_import.log.append('sample message')
      data_import.save
      data_import.log.to_s.should =~ /sample message/
    end

    it 'is fetched after retrieving the data_import object from DB' do
      data_import = DataImport.new(
        user_id:    @user.id,
        table_name: 'foo',
        from_query: 'bogus'
      )
      data_import.log.append('sample message')
      # Logs get saved at checkpoints or certain operations, so force store
      data_import.log.store
      data_import.save

      rehydrated_data_import = DataImport[id: data_import.id]
      data_import.log.to_s.should == rehydrated_data_import.log.to_s
    end

    it 'will not overwrite an existing logger field' do
      data_import = DataImport.new(
        user_id:    @user.id,
        table_name: 'foo',
        from_query: 'bogus',
      )
      data_import.save
      data_import.logger = 'existing log'
      data_import.this.update(logger: 'existing log')
      data_import.logger.should == 'existing log'
      data_import.log.append('sample message')
      data_import.log.to_s.should =~ /sample message/
      data_import.save
      data_import.logger.should == 'existing log'
    end
  end

  context 'viewer users' do
    after(:each) do
      @user.viewer = false
      @user.save
    end

    it "can't create new data imports" do
      @user.viewer = true
      @user.save

      data_import = DataImport.new(
        user_id:    @user.id,
        table_name: 'fromviewer',
        from_query: 'fromviewer_q'
      )
      expect { data_import.save }.to raise_error(Sequel::ValidationFailed, "user Viewer users can't create data imports")
    end
  end
end

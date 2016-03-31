# encoding: utf-8
require_relative '../spec_helper'

describe DataImport do
  before(:each) do
    ::User.all.each(&:destroy)
    @user = create_user(username: 'test', email: "client@example.com", password: "clientex")
    stub_named_maps_calls
    @table = create_table(user_id: @user.id)
  end

  after(:all) do
    stub_named_maps_calls
    @user.destroy
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
    user = create_user
    user.save
    Table.any_instance.stubs(:cartodbfy).raises(CartoDB::CartoDBfyInvalidID)
    data_import = DataImport.create(
      user_id: user.id,
      data_source: '/../db/fake_data/clubbing.csv',
      updated_at: Time.now
    )

    data_import.run_import!
    data_import.error_code.should == 2011
  end

  it 'raises a meaningful error if over storage quota' do
    previous_quota_in_bytes = @user.quota_in_bytes
    @user.quota_in_bytes = 0
    @user.save

    data_import = DataImport.create(
      user_id: @user.id,
      data_source: '/../db/fake_data/clubbing.csv',
      updated_at: Time.now
    ).run_import!

    @user.quota_in_bytes = previous_quota_in_bytes
    @user.save
    data_import.error_code.should == 8001
  end

  it 'raises a meaningful error if over table quota' do
    user = create_user
    user.save
    previous_table_quota = @user.table_quota
    user.table_quota = 0
    user.save

    data_import = DataImport.create(
      user_id: user.id,
      data_source: '/../db/fake_data/clubbing.csv',
      updated_at: Time.now
    ).run_import!

    user.table_quota = previous_table_quota
    user.save

    data_import.error_code.should == 8002
  end

  it 'should allow to duplicate an existing table' do
    data_import = DataImport.create(
      user_id: @user.id,
      table_name: 'duplicated_table',
      updated_at: Time.now,
      table_copy: @table.name).run_import!
    duplicated_table = ::UserTable.where(id: data_import.table_id).first
    duplicated_table.should_not be_nil
    duplicated_table.name.should be == 'duplicated_table'
  end

  it 'should allow to create a table from a query' do
    user = create_user
    user.save
    data_import_1 = DataImport.create(
      user_id: user.id,
      data_source: '/../db/fake_data/clubbing.csv',
      updated_at: Time.now).run_import!
    data_import_1.state.should be == 'complete'

    data_import_2 = DataImport.create(
      user_id: user.id,
      table_name: 'from_query',
      updated_at: Time.now,
      from_query: "SELECT * FROM #{data_import_1.table_name} LIMIT 5").run_import!
    data_import_2.state.should be == 'complete'

    duplicated_table = ::UserTable.where(id: data_import_2.table_id).first
    duplicated_table.should_not be_nil
    duplicated_table.name.should be == 'from_query'
    duplicated_table.service.records[:rows].should have(5).items
  end

  it 'imports a simple file' do
    user = create_user
    user.save
    data_import = DataImport.create(
      user_id: user.id,
      data_source: '/../db/fake_data/clubbing.csv',
      updated_at: Time.now
    ).run_import!

    table = ::UserTable.where(id: data_import.table_id).first
    table.should_not be_nil
    table.name.should be == 'clubbing'
    table.service.records[:rows].should have(10).items
  end

  it 'imports a simple file with latlon' do
    user = create_user
    user.save
    data_import = DataImport.create(
      user_id: user.id,
      data_source: '/../services/importer/spec/fixtures/csv_with_geojson.csv',
      updated_at: Time.now
    ).run_import!

    table = ::UserTable.where(id: data_import.table_id).first
    table.should_not be_nil
  end

  it 'should allow to create a table from a url' do
    user = create_user
    user.save
    data_import = nil
    serve_file Rails.root.join('db/fake_data/clubbing.csv') do |url|
      data_import = DataImport.create(
        user_id: user.id,
        data_source: url,
        updated_at: Time.now).run_import!
    end

    table = ::UserTable.where(id: data_import.table_id).first
    table.should_not be_nil
    table.name.should be == 'clubbing'
    table.service.records[:rows].should have(10).items
  end

  it 'should allow to create a table from a url with params' do
    user = create_user
    user.save
    data_import = nil
    serve_file Rails.root.join('db/fake_data/clubbing.csv?param=wadus'),
               headers: { "content-type" => "text/plain" } do |url|
      data_import = DataImport.create(
        user_id: user.id,
        data_source: url,
        updated_at: Time.now).run_import!
    end

    table = ::UserTable.where(id: data_import.table_id).first
    table.should_not be_nil
    table.name.should be == 'clubbing'
    table.service.records[:rows].should have(10).items
  end

  it "can create a table from a query selecting only the cartodb_id" do
    user = create_user
    user.save
    data_import_1 = DataImport.create(
      user_id: user.id,
      data_source: '/../db/fake_data/clubbing.csv',
      updated_at: Time.now).run_import!
    data_import_1.state.should be == 'complete'

    data_import_2 = DataImport.create(
      user_id: user.id,
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
     Cartodb.config[:common_data] = {}
    Cartodb.config[:common_data]['username'] = 'mycommondata'
    Cartodb.config[:common_data]['host'] = 'cartodb.wadus.com'
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: "http://mycommondata.cartodb.wadus.com/foo.csv"
    )
    data_import.from_common_data?.should eq true
  end

  it 'should not consider a import as common data if common_data config does not exist' do
    Cartodb.config.delete(:common_data)
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: "http://mycommondata.cartodb.wadus.com/foo.csv"
    )
    data_import.from_common_data?.should eq false
  end

  it 'should not consider a import as common data if common_data config does not match with url' do
    Cartodb.config[:common_data] = {}
    Cartodb.config[:common_data]['username'] = 'mycommondata'
    Cartodb.config[:common_data]['host'] = 'cartodb.wadus.com'
    data_import = DataImport.create(
      user_id: @user.id,
      data_source: "http://mydatasource.cartodb.wadus.com/foo.csv"
    )
    data_import.from_common_data?.should eq false
  end

  describe 'log' do
    it 'is initialized to a CartoDB::Log instance' do
      data_import = DataImport.create(
        user_id: @user.id,
        data_source: "http://mydatasource.cartodb.wadus.com/foo.csv"
      )
      data_import.log.should be_instance_of CartoDB::Log
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
end

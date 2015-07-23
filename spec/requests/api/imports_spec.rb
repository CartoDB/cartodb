#encoding: UTF-8

require 'spec_helper'

describe "Imports API" do

  before(:all) do
    $user_1 = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
    delete_user_data $user_1
    host! "#{$user_1.username}.localhost.lan"
  end

  after(:all) do
    delete_user_data $user_1
    $user_1.update table_quota: 500
  end

  let(:params) { { :api_key => $user_1.api_key } }

  it 'performs asynchronous imports' do
    f = upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')
    post api_v1_imports_create_url(
      params.merge(:filename  => 'column_number_to_boolean.csv',
                   :table_name => "wadus")),
      f.read.force_encoding('UTF-8')


    response.code.should be == '200'
    response_json = JSON.parse(response.body)

    last_import = DataImport[response_json['item_queue_id']]
    last_import.state.should be == 'complete'
    table = UserTable[last_import.table_id]
    table.name.should == "column_number_to_boolean"
    table.map.data_layers.first.options["table_name"].should == "column_number_to_boolean"
  end

  it 'performs asynchronous url imports' do
    serve_file Rails.root.join('db/fake_data/clubbing.csv') do |url|
      post api_v1_imports_create_url(params.merge(:url        => url,
                                       :table_name => "wadus"))
    end

    response.code.should be == '200'
    response_json = JSON.parse(response.body)

    last_import = DataImport[response_json['item_queue_id']]
    last_import.state.should be == 'complete'
  end

  pending 'appends data to an existing table' do
    @table = FactoryGirl.create(:table, :user_id => $user_1.id)

    f = upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')
    post api_v1_imports_create_url(
      params.merge(:filename   => 'column_number_to_boolean.csv',
                   :table_id   => @table.id,
                   :append     => true)), f.read.force_encoding('UTF-8')


    response.code.should be == '200'
    response_json = JSON.parse(response.body)

    last_import = DataImport[response_json['item_queue_id']]
    last_import.state.should be == 'complete'

    @table.reload.rows_counted.should be == 4
  end

  it 'duplicates a table' do
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'))

    @table_from_import = UserTable.all.last.service

    post api_v1_imports_create_url(params.merge(:table_name => 'wadus_copy__copy',
                                     :table_copy => @table_from_import.name))

    response.code.should be == '200'
    response_json = JSON.parse(response.body)

    last_import = DataImport[response_json['item_queue_id']]
    last_import.state.should be == 'complete'

    import_table = UserTable.all.last.service
    import_table.rows_counted.should be == @table_from_import.rows_counted
    import_table.should have_required_indexes_and_triggers
  end

  it 'duplicates a table without geometries' do
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/csv_with_number_columns.csv', 'application/octet-stream'))

    @table_from_import = UserTable.all.last.service

    post api_v1_imports_create_url(params.merge(:table_name => 'wadus_copy__copy',
                                     :table_copy => @table_from_import.name))

    response.code.should be == '200'
    response_json = JSON.parse(response.body)

    last_import = DataImport[response_json['item_queue_id']]
    last_import.state.should be == 'complete'

    import_table = UserTable.all.last.service
    import_table.rows_counted.should be == @table_from_import.rows_counted
    import_table.should have_required_indexes_and_triggers
  end

  it 'imports all the sample data' do
    $user_1.update table_quota: 10
    import_files = [
        "http://cartodb.s3.amazonaws.com/static/TM_WORLD_BORDERS_SIMPL-0.3.zip",
    ]

    import_files.each do |url|
      post api_v1_imports_create_url(params.merge(:url => url, :table_name => "wadus"))

      response.code.should be == '200'

      response_json = JSON.parse(response.body)
      last_import = DataImport[response_json['item_queue_id']]

      last_import.state.should be == 'complete'
      table = UserTable[last_import.table_id].service

      table.should have_required_indexes_and_triggers
      table.should have_no_invalid_the_geom
      table.geometry_types.should_not be_blank
    end

    DataImport.count.should == import_files.size
    Map.count.should == import_files.size
  end

  it 'raises an error if the user attempts to import tables when being over quota' do
    $user_1.update table_quota: 5

    # This file contains 10 data sources
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(:url        => url,
                                       :table_name => "wadus")
    end
    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 8002
    $user_1.reload.tables.count.should == 0
  end

  it 'raises an error if the user attempts to import tables when being over disk quota' do
    $user_1.update quota_in_bytes: 1000, table_quota: 200
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(:url        => url,
                                       :table_name => "wadus")
    end
    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 8001
    $user_1.reload.tables.count.should == 0
  end

  it 'raises an error if the user attempts to duplicate a table when being over quota' do
    $user_1.update table_quota: 1, quota_in_bytes: 100.megabytes

    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/_penguins_below_80.zip', 'application/octet-stream'))

    @table_from_import = UserTable.all.last.service
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'complete', "Import failure: #{last_import.log}"

    post api_v1_imports_create_url, params.merge(:table_name => 'wadus_copy__copy',
                                      :table_copy => @table_from_import.name)

    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 8002
    $user_1.reload.tables.count.should == 1
  end

  it 'imports data when the user has infinite tables' do
    $user_1.update table_quota: nil

    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'))

    @table_from_import = UserTable.all.last.service

    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'complete'
    $user_1.reload.tables.count.should == 1
  end

  it 'updates tables_created_count upon finished import' do
    post api_v1_imports_create_url, 
        params.merge(:filename => upload_file('spec/support/data/zipped_ab.zip', 'application/octet-stream'))

    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'complete'
    last_import.tables_created_count.should eq 2
    last_import.table_names.should eq 'zipped_a zipped_b'
  end

  it 'properly reports table row count limit' do
    old_max_import_row_count = $user_1.max_import_table_row_count
    $user_1.update max_import_table_row_count: 2

    # Internally uses reltuples from pg_class which is an estimation and non-deterministic so...
    CartoDB::PlatformLimits::Importer::TableRowCount.any_instance.expects(:get).returns(5)

    post api_v1_imports_create_url,
         params.merge(:filename => upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'))

    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 6668

    $user_1.update max_import_table_row_count: old_max_import_row_count
  end

end

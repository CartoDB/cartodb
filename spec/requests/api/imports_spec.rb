#encoding: UTF-8

require 'spec_helper'

describe "Imports API" do

  before(:all) do
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
    delete_user_data @user
    host! 'test.localhost.lan'
  end

  after(:all) do
    @user.destroy
  end

  let(:params) { { :api_key => @user.api_key } }

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

  it 'gets a list of all pending imports' do
    Resque.inline = false
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(:url        => url,
                                        :table_name => "wadus")
    end

    get api_v1_imports_index_url, params

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    imports = response_json['imports']
    imports.should have(1).items
    Resque.inline = true
  end

  it "doesn't return old pending imports" do
    Resque.inline = false
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(:url        => url,
                                        :table_name => "wadus")
    end

    Delorean.jump(7.hours)
    get api_v1_imports_index_url, params

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    imports = response_json['imports']
    imports.should have(0).items
    Resque.inline = true
    Delorean.back_to_the_present
  end

  it 'gets the detail of an import' do
    post api_v1_imports_create_url(:api_key => @user.api_key,
                        :table_name => 'wadus',
                        :filename   => File.basename('wadus.csv')),
      upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'

    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  it 'tries to import a tgz' do
    pending 'There is a problem with either unp or tar using tgz files. needs investigation'

    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/Weird Filename (2).tgz', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'
    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  it 'fails with password protected files' do
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/alldata-pass.zip', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'
    import = JSON.parse(response.body)
    import['state'].should be == 'failure'
  end


  it 'imports files with weird filenames' do
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/Weird Filename (2).csv', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(:id => item_queue_id), params

    response.code.should be == '200'
    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  pending 'appends data to an existing table' do
    @table = FactoryGirl.create(:table, :user_id => @user.id)

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

  it 'creates a table from a sql query' do
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/_penguins_below_80.zip', 'application/octet-stream'))

    response.code.should be == '200'

    @table_from_import = UserTable.all.last.service

    post api_v1_imports_create_url(:api_key    => @user.api_key,
                        :table_name => 'wadus_2',
                        :sql        => "SELECT * FROM #{@table_from_import.name}")


    response.code.should be == '200'

    response_json = JSON.parse(response.body)

    last_import = DataImport[response_json['item_queue_id']]
    last_import.state.should be == 'complete'

    import_table = UserTable.all.last.service
    import_table.rows_counted.should be == @table_from_import.rows_counted
    import_table.should have_required_indexes_and_triggers
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
    @user.update table_quota: 10
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
    @user.update table_quota: 5

    # This file contains 10 data sources
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(:url        => url,
                                       :table_name => "wadus")
    end
    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 8002
    @user.reload.tables.count.should == 0
  end

  it 'raises an error if the user attempts to import tables when being over disk quota' do
    @user.update quota_in_bytes: 1000, table_quota: 200
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(:url        => url,
                                       :table_name => "wadus")
    end
    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 8001
    @user.reload.tables.count.should == 0
  end

  it 'raises an error if the user attempts to duplicate a table when being over quota' do
    @user.update table_quota: 1, quota_in_bytes: 100.megabytes

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
    @user.reload.tables.count.should == 1
  end

  it 'imports data when the user has infinite tables' do
    @user.update table_quota: nil

    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'))

    @table_from_import = UserTable.all.last.service

    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'complete'
    @user.reload.tables.count.should == 1
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
    old_max_import_row_count = @user.max_import_table_row_count
    @user.update max_import_table_row_count: 2

    # Internally uses reltuples from pg_class which is an estimation and non-deterministic so...
    CartoDB::PlatformLimits::Importer::TableRowCount.any_instance.expects(:get).returns(5)

    post api_v1_imports_create_url,
         params.merge(:filename => upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'))

    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 6668

    @user.update max_import_table_row_count: old_max_import_row_count
  end

  it 'returns derived visualization id if created with create_vis flag' do
    @user.update private_tables_enabled: false
    post api_v1_imports_create_url,
         params.merge({
                        filename: upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'),
                        create_vis: true
                      })
    response.code.should be == '200'

    item_queue_id = ::JSON.parse(response.body)['item_queue_id']

    get api_v1_imports_show_url(id: item_queue_id), params

    import = DataImport[item_queue_id]

    import.state.should be == 'complete'
    import.visualization_id.nil?.should eq false
    import.create_visualization.should eq true

    vis = CartoDB::Visualization::Member.new(id: import.visualization_id).fetch
    vis.nil?.should eq false
    vis.name =~ /csv_with_lat_lon/  # just in case we change the prefix

    @user.update private_tables_enabled: true
  end

end

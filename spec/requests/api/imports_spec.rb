#encoding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../../spec_helper')

describe "Imports API" do

  before(:all) do
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    @user.set_map_key
  end

  before(:each) do
    delete_user_data @user
    host! 'test.localhost.lan'
  end

  let(:params) { { :api_key => @user.get_map_key } }

  it 'performs asynchronous imports' do
    f = upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')
    post v1_imports_url(
      params.merge(:filename  => 'column_number_to_boolean.csv',
                   :table_name => "wadus")), 
      f.read.force_encoding('UTF-8')


    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['item_queue_id'].should_not be_empty

    last_import = DataImport.order(:updated_at.desc).first
    last_import.queue_id.should be == response_json['item_queue_id']
    last_import.state.should be == 'complete'
    table = Table[last_import.table_id]
    table.name.should == "column_number_to_boo"
    table.map.data_layers.first.options["table_name"].should == "column_number_to_boo"
  end

  it 'performs asynchronous url imports' do
    serve_file Rails.root.join('db/fake_data/clubbing.csv') do |url|
      post v1_imports_url(params.merge(:url        => url,
                                       :table_name => "wadus"))
    end

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['item_queue_id'].should_not be_empty

    last_import = DataImport.order(:updated_at.desc).first
    last_import.queue_id.should be == response_json['item_queue_id']
    last_import.state.should be == 'complete'
  end

  it 'performs synchronous imports'

  it 'gets a list of all pending imports' do

    thread = Thread.new do |number|
      serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
        post v1_imports_url, params.merge(:url        => url,
                                          :table_name => "wadus")
      end
    end

    thread.join

    get v1_imports_url, params

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    imports = response_json['imports']
    imports.should have(1).items

  end

  it 'gets the detail of an import' do
    post v1_imports_url(:api_key => @user.get_map_key,
                        :table_name => 'wadus',
                        :filename   => File.basename('wadus.csv')),
      upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get v1_import_url(:id => item_queue_id), params

    response.code.should be == '200'

    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  it 'imports files with weird filenames' do
    post v1_imports_url,
      params.merge(:filename => upload_file('spec/support/data/_penguins_below_80 (2).tgz', 'application/octet-stream'))

    item_queue_id = JSON.parse(response.body)['item_queue_id']

    get v1_import_url(:id => item_queue_id), params

    response.code.should be == '200'

    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
  end

  it 'appends data to an existing table' do
    @table = FactoryGirl.create(:table, :user_id => @user.id)

    f = upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')
    post v1_imports_url(
      params.merge(:filename   => 'column_number_to_boolean.csv',
                   :table_id   => @table.id,
                   :append     => true)), f.read.force_encoding('UTF-8')


    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['item_queue_id'].should_not be_empty

    last_import = DataImport.order(:updated_at.desc).first
    last_import.queue_id.should be == response_json['item_queue_id']
    last_import.state.should be == 'complete'

    @table.reload.rows_counted.should be == 4
  end

  it 'creates a table from a sql query' do
    post v1_imports_url,
      params.merge(:filename => upload_file('spec/support/data/_penguins_below_80 (2).tgz', 'application/octet-stream'))


    @table_from_import = Table.all.last

    post v1_imports_url(:api_key    => @user.get_map_key,
                        :table_name => 'wadus_2',
                        :sql        => "SELECT * FROM #{@table_from_import.name}")


    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['item_queue_id'].should_not be_empty

    last_import = DataImport.order(:updated_at.desc).first
    last_import.queue_id.should be == response_json['item_queue_id']
    last_import.state.should be == 'complete'

    import_table = Table.all.last
    import_table.rows_counted.should be == @table_from_import.rows_counted
    import_table.should have_required_indexes_and_triggers
  end

  it 'duplicates a table' do
    post v1_imports_url,
      params.merge(:filename => upload_file('spec/support/data/_penguins_below_80 (2).tgz', 'application/octet-stream'))

    @table_from_import = Table.all.last

    post v1_imports_url(params.merge(:table_name => 'wadus_copy__copy',
                                     :table_copy => @table_from_import.name))

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['item_queue_id'].should_not be_empty

    last_import = DataImport.order(:updated_at.desc).first
    last_import.queue_id.should be == response_json['item_queue_id']
    last_import.state.should be == 'complete'

    import_table = Table.all.last
    import_table.rows_counted.should be == @table_from_import.rows_counted
    import_table.should have_required_indexes_and_triggers
  end

  it 'gets a list of pending imports'
  it 'gets a list of failed imports'
  it 'gets a list of succeeded imports'
  it 'kills pending imports'

  it 'imports all the sample data' do
    @user.update table_quota: 10
    import_files = ["http://cartodb.s3.amazonaws.com/static/TM_WORLD_BORDERS_SIMPL-0.3.zip",
                    "http://cartodb.s3.amazonaws.com/static/european_countries.zip",
                    "http://cartodb.s3.amazonaws.com/static/50m-urban-area.zip",
                    "http://cartodb.s3.amazonaws.com/static/10m-populated-places-simple.zip",
                    "http://cartodb.s3.amazonaws.com/static/50m-rivers-lake-centerlines-with-scale-ranks.zip",
                    "http://cartodb.s3.amazonaws.com/static/counties_ny.zip",
                    "http://cartodb.s3.amazonaws.com/static/nyc_subway_entrance.zip"]

    import_files.each do |url|

      post v1_imports_url(params.merge(:url        => url,
                                       :table_name => "wadus"))


      response.code.should be == '200'

      response_json = JSON.parse(response.body)
      response_json.should_not be_nil
      response_json['item_queue_id'].should_not be_empty

      last_import = DataImport.order(:updated_at.desc).first

      last_import.queue_id.should be == response_json['item_queue_id']
      last_import.state.should be == 'complete'
      table = Table.order(:id).last
      table.should have_required_indexes_and_triggers
    end
    
    DataImport.count.should == import_files.size
    Map.count.should == import_files.size
  end

  it 'raises an error if the user attempts to import tables when being over quota' do
    @user.update table_quota: 5

    # This file contains 10 data sources
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post v1_imports_url, params.merge(:url        => url,
                                       :table_name => "wadus")
    end
    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 8002
    @user.reload.tables.count.should == 0
  end

  it 'raises an error if the user attempts to duplicate a table when being over quota' do
    @user.update table_quota: 1

    post v1_imports_url,
      params.merge(:filename => upload_file('spec/support/data/_penguins_below_80 (2).tgz', 'application/octet-stream'))

    @table_from_import = Table.all.last

    post v1_imports_url, params.merge(:table_name => 'wadus_copy__copy',
                                      :table_copy => @table_from_import.name)

    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 8002
    @user.reload.tables.count.should == 1
  end

  it 'imports data when the user has infinite tables' do
    @user.update table_quota: nil

    post v1_imports_url,
      params.merge(:filename => upload_file('spec/support/data/_penguins_below_80 (2).tgz', 'application/octet-stream'))

    @table_from_import = Table.all.last

    response.code.should be == '200'
    last_import = DataImport.order(:updated_at.desc).first
    last_import.state.should be == 'complete'
    @user.reload.tables.count.should == 1
  end


  it 'returns info for each created table' do
    @user.update table_quota: 10
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post v1_imports_url, params.merge(:url        => url,
                                        :table_name => "wadus")
    end

    response.code.should be == '200'

    response_json = JSON.parse(response.body)
    response_json.should_not be_nil
    response_json['item_queue_id'].should_not be_empty

    last_import = DataImport.order(:updated_at.desc).first
    last_import.queue_id.should be == response_json['item_queue_id']
    last_import.state.should be == 'complete'
    last_import.tables_created_count.should be == 10

    item_queue_id = response_json['item_queue_id']

    get v1_import_url(:id => item_queue_id), :api_key => @user.get_map_key

    response.code.should be == '200'

    import = JSON.parse(response.body)
    import['state'].should be == 'complete'
    import['tables_created_count'].should be == 10
  end

end

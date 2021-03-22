require 'spec_helper_unit'

describe "Imports API" do
  before do
    @user = create(:valid_user)
    host! "#{@user.username}.localhost.lan"
  end

  def auth_params
    { user_domain: @user.username, api_key: @user.api_key }
  end

  let(:params) { { :api_key => @user.api_key } }

  it 'performs asynchronous imports' do
    f = upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')
    post api_v1_imports_create_url(params.merge(table_name: "wadus")), filename: f

    response.code.should be == '200'
    response_json = JSON.parse(response.body)

    last_import = DataImport[response_json['item_queue_id']]
    last_import.state.should be == 'complete'
    table = UserTable[last_import.table_id]
    table.name.should == "column_number_to_boolean"
    table.map.data_layers.first.options["table_name"].should == "column_number_to_boolean"
  end

  it 'performs asynchronous imports (file parameter, used in API docs)' do
    f = upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')
    post api_v1_imports_create_url(params.merge(table_name: "wadus")), file: f

    response.code.should be == '200'
    response_json = JSON.parse(response.body)

    last_import = DataImport[response_json['item_queue_id']]
    last_import.state.should be == 'complete'
    table = UserTable[last_import.table_id]
    table.name.should == "column_number_to_boolean"
    table.map.data_layers.first.options["table_name"].should == "column_number_to_boolean"
  end

  it 'performs asynchronous url imports' do
    CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
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
    @table = create(:table, :user_id => @user.id)

    f = upload_file('db/fake_data/column_number_to_boolean.csv', 'text/csv')
    post api_v1_imports_create_url(params.merge(table_id: @table.id, append: true)),
         f.read.force_encoding('UTF-8'),
         filename: f

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

  it 'detects lat/long columns and produces a the_geom column from them' do
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'))
    @table_from_import = UserTable.all.last.service

    @table_from_import.geometry_types.should == ["ST_Point"]
    @table_from_import.record(1)[:the_geom].should == '{"type":"Point","coordinates":[16.5607329,48.1199611]}'
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

    CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
    serve_file(Rails.root.join('spec/support/data/TM_WORLD_BORDERS_SIMPL-0.3.zip')) do |url|
      post api_v1_imports_create_url(params.merge(url: url, table_name: "wadus"))

      response.code.should be == '200'

      response_json = JSON.parse(response.body)
      last_import = DataImport[response_json['item_queue_id']]

      last_import.state.should be == 'complete'
      table = UserTable[last_import.table_id].service

      table.should have_required_indexes_and_triggers
      table.should have_no_invalid_the_geom
      table.geometry_types.should_not be_blank

      table.map.should be
    end
  end

  it 'raises an error if the user attempts to import tables when being over quota' do
    @user.update table_quota: 1

    # This file contains 6 data sources
    CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(:url        => url,
                                       :table_name => "wadus")
    end
    response.code.should be == '200'
    last_import = DataImport.order(Sequel.desc(:updated_at)).first
    last_import.tables_created_count.should be_nil
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 8002
    last_import.log.collect_entries.should include('Results would set overquota')
    @user.reload.tables.count.should == 0
  end

  it 'raises an error if the user attempts to import tables when being over disk quota' do
    @user.update quota_in_bytes: 1000, table_quota: 200
    CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
    serve_file(Rails.root.join('spec/support/data/ESP_adm.zip')) do |url|
      post api_v1_imports_create_url, params.merge(:url        => url,
                                       :table_name => "wadus")
    end
    response.code.should be == '200'
    last_import = DataImport.order(Sequel.desc(:updated_at)).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 8001
    @user.reload.tables.count.should == 0
  end

  it 'raises an error if the user attempts to duplicate a table when being over quota' do
    @user.update table_quota: 1, quota_in_bytes: 100.megabytes

    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/_penguins_below_80.zip', 'application/octet-stream'))

    @table_from_import = UserTable.all.last.service
    last_import = DataImport.order(Sequel.desc(:updated_at)).first
    last_import.state.should be == 'complete', "Import failure: #{last_import.log}"

    post api_v1_imports_create_url, params.merge(:table_name => 'wadus_copy__copy',
                                      :table_copy => @table_from_import.name)

    response.code.should be == '200'
    last_import = DataImport.order(Sequel.desc(:updated_at)).first
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
    last_import = DataImport.order(Sequel.desc(:updated_at)).first
    last_import.state.should be == 'complete'
    @user.reload.tables.count.should == 1
  end

  it 'updates tables_created_count upon finished import' do
    post api_v1_imports_create_url,
        params.merge(:filename => upload_file('spec/support/data/zipped_ab.zip', 'application/octet-stream'))

    response.code.should be == '200'
    last_import = DataImport.order(Sequel.desc(:updated_at)).first
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
    last_import = DataImport.order(Sequel.desc(:updated_at)).first
    last_import.state.should be == 'failure'
    last_import.error_code.should be == 6668

    @user.update max_import_table_row_count: old_max_import_row_count
  end

  it 'keeps api_key grants for replaced tables' do
    # imports two files
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/csv_with_lat_lon.csv', 'application/octet-stream'))
    post api_v1_imports_create_url,
      params.merge(:filename => upload_file('spec/support/data/csv_with_number_columns.csv', 'application/octet-stream'))

    # get the last one
    @table_from_import = UserTable.all.last.service

    # creates an api_key for both files
    grants = [
      {
        type: "apis",
        apis: ["sql", "maps"]
      },
      {
        type: "database",
        tables: [
          {
            schema: @user.database_schema,
            name: 'csv_with_lat_lon',
            permissions: [
              "insert",
              "select",
              "update",
              "delete"
            ]
          },
          {
            schema: @user.database_schema,
            name: 'csv_with_number_columns',
            permissions: [
              "select"
            ]
          }
        ]
      }
    ]
    name = 'wadus'
    payload = {
      name: name,
      grants: grants
    }
    post_json api_keys_url, auth_params.merge(payload), http_json_headers

    # replace the file
    post api_v1_imports_create_url,
      params.merge(
        :filename => upload_file('spec/support/data/csv_with_number_columns.csv', 'application/octet-stream'),
        :collision_strategy => 'overwrite'
      )

    # gets the api_keys
    get_json api_key_url(id: 'wadus'), auth_params, http_json_headers do |response|
      response.status.should eq 200
      response.body[:grants][1][:tables][1][:name] = @table_from_import
    end
  end

end

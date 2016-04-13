# encoding: utf-8

shared_examples_for "records controllers" do

  describe '#show legacy tests' do

    before(:all) do
      @user = FactoryGirl.create(:valid_user)
    end

    before(:each) do
      stub_named_maps_calls
      delete_user_data @user
      @table = create_table :user_id => @user.id
    end

    after(:all) do
      stub_named_maps_calls
      @user.destroy
    end


    let(:params) { { api_key: @user.api_key, table_id: @table.name, user_domain: @user.username } }


    it "Insert a new row and get the record" do
      payload   = {
        name: "Name 123",
        description: "The description"
      }

      post_json api_v1_tables_records_create_url(params.merge(payload)) do |response|
        response.status.should be_success
        response.body[:cartodb_id].should == 1
      end

      get_json api_v1_tables_records_show_url(params.merge(id: 1)) do |response|
        response.status.should be_success
        response.body[:cartodb_id].should == 1
        response.body[:name].should == payload[:name]
        response.body[:description].should == payload[:description]
      end
    end

    it "Get a record that doesn't exist" do
      get_json api_v1_tables_records_show_url(params.merge(id: 1)) do |response|
        response.status.should == 404
      end
    end

    it "Update a row" do
      pk = @table.insert_row!(
        name: String.random(10),
        description: String.random(50),
        the_geom: %Q{\{"type":"Point","coordinates":[0.966797,55.91843]\}}
      )

      payload = {
        id:           pk,
        name:         "Name updated",
        description:  "Description updated",
        the_geom:     "{\"type\":\"Point\",\"coordinates\":[-3.010254,55.973798]}"
      }

      put_json api_v1_tables_record_update_url(params.merge(payload)) do |response|
        response.status.should be_success
        response.body[:cartodb_id].should == pk
        response.body[:name].should == payload[:name]
        response.body[:description].should == payload[:description]
        response.body[:the_geom].should == payload[:the_geom]
      end
    end

    it "Update a row that doesn't exist" do
      payload = {
        id:          1,
        name:        "Name updated",
        description: "Description updated"
      }

      put_json api_v1_tables_record_update_url(params.merge(payload)) do |response|
        response.status.should == 404
      end
    end

    it "Remove a row" do
      pk = @table.insert_row!(
        name: String.random(10),
        description: String.random(50),
        the_geom: %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}
      )

      delete_json api_v1_tables_record_update_url(params.merge(id: pk)) do |response|
        response.status.should == 204
        @table.rows_counted.should == 0
      end
    end

    it "Remove multiple rows" do
      the_geom = %Q{
        \{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}
      }
      pk  = @table.insert_row!(
        name:         String.random(10),
        description:  String.random(50),
        the_geom:     the_geom
      )

      pk1  = @table.insert_row!(
        name:         String.random(10),
        description:  String.random(50),
        the_geom:     the_geom
      )

      pk2  = @table.insert_row!(
        name:         String.random(10),
        description:  String.random(50),
        the_geom:     the_geom
      )

      pk3  = @table.insert_row!(
        name:         String.random(10),
        description:  String.random(50),
        the_geom:     the_geom
      )

      @table.rows_counted.should == 4

      delete_json api_v1_tables_record_update_url(params.merge(id: pk1)) do |response|
          response.status.should == 204
          @table.rows_counted.should == 3
      end

      delete_json api_v1_tables_record_update_url(params.merge(id: pk2)) do |response|
          response.status.should == 204
          @table.rows_counted.should == 2
      end

      delete_json api_v1_tables_record_update_url(params.merge(id: pk3)) do |response|
          response.status.should == 204
          @table.rows_counted.should == 1
      end
    end

    it 'Create a new row of type number and insert float values' do
      payload   = {
        name:   'My new imported table',
        schema: 'name varchar, age integer'
      }

      table_name = post_json api_v1_tables_create_url(params.merge(payload)) do |response|
        response.status.should be_success
        response.body[:name]
      end

      # this test uses its own table
      custom_params = params.merge({table_id: table_name})

      payload = {
        name: 'Fernando Blat',
        age: '29'
      }

      post_json api_v1_tables_records_create_url(custom_params.merge(payload)) do |response|
        response.status.should be_success
      end

      payload = {
        name: 'Beatriz',
        age: 30.2
      }

      row_id = post_json api_v1_tables_records_create_url(custom_params.merge(payload)) do |response|
        response.status.should be_success
        response.body[:cartodb_id]
      end

      get_json api_v1_tables_records_show_url(custom_params.merge(id: row_id)) do |response|
        response.status.should be_success
        response.body[:name].should == payload[:name]
        response.body[:age].should == payload[:age]
      end
    end

    it "Create a new row including the_geom field" do
      lat = Float.random_latitude
      lon = Float.random_longitude

      payload = {
        name:         "Fernando Blat",
        description:  "Geolocated programmer",
        the_geom:     %Q{\{"type":"Point","coordinates":[#{lon.to_f},#{lat.to_f}]\}}
      }

      post_json api_v1_tables_records_create_url(params.merge(payload)) do |response|
        response.status.should be_success
        # INFO: Postgis sometimes rounds up so cannot directly compare values
        #response.body[:the_geom].should == payload[:the_geom]
        (/\"type\":\"point\"/i =~ response.body[:the_geom]).nil?.should eq false
        response.body[:name].should == payload[:name]
        response.body[:description].should == payload[:description]
      end
    end

    it "Update a row including the_geom field" do
      lat = Float.random_latitude
      lon = Float.random_longitude
      pk = nil


      payload = {
        name:         "Fernando Blat",
        description:  "Geolocated programmer",
        the_geom:     %Q{\{"type":"Point","coordinates":[#{lon.to_f},#{lat.to_f}]\}}
      }

      pk = post_json api_v1_tables_records_create_url(params.merge(payload)) do |response|
        response.status.should be_success
        response.body[:cartodb_id]
      end

      lat = Float.random_latitude
      lon = Float.random_longitude
      payload = {
        id:           pk,
        the_geom:     %Q{\{"type":"Point","coordinates":[#{lon.to_f},#{lat.to_f}]\}}
      }

      put_json api_v1_tables_record_update_url(params.merge(payload)) do |response|
        response.status.should be_success
        (/\"type\":\"point\"/i =~ response.body[:the_geom]).nil?.should eq false
        # INFO: Postgis sometimes rounds up so cannot directly compare values
        #response.body[:the_geom].should == payload[:the_geom]
      end
    end


  end

end

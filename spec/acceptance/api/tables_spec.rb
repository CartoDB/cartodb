# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 tables management" do

  background do
    Capybara.current_driver = :rack_test
    @user = create_user
    login_as @user
  end

  scenario "Get tables" do
    get_json api_tables_url
    parse_json(response) do |r|
      r.status.should be_success
      r.body.should == []
    end

    another_user = create_user

    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"
    table2 = create_table :user_id => @user.id, :name => 'My table #2', :privacy => Table::PRIVATE
    table3 = create_table :user_id => another_user.id, :name => 'Another table #3', :privacy => Table::PRIVATE

    get_json api_tables_url
    parse_json(response) do |r|
      r.status.should be_success
      r.body.should include({
        "id" => table1.id,
        "name" => "my_table_1",
        "privacy" => "PUBLIC",
        "tags" => "tag 1,tag 2,tag 3",
        "schema" => default_schema
      })
      r.body.map{ |t| t['name'] }.should_not include("another_table_3")
    end
  end

  scenario "Create a new table without schema" do
    post_json api_tables_url

    parse_json(response) do |r|
      r.status.should be_success
      r.body[:id].should == response.location.match(/\/(\d+)$/)[1].to_i
      r.body[:name].should match(/^untitle/)
      r.body[:schema].should == default_schema
    end
  end

  scenario "Create a new table specifing a name and a schema" do
    post_json api_tables_url, {:name => "My new imported table", :schema => "bla bla blat"}
    parse_json(response) do |r|
      r.status.should == 400
    end

    post_json api_tables_url, {:name => "My new imported table", :schema => "code varchar, title varchar, did integer, date_prod timestamp, kind varchar"}
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "my_new_imported_table"
      r.body[:schema].should == [
         ["cartodb_id", "number"], ["code", "string"], ["title", "string"], ["did", "number"],
         ["date_prod", "date"], ["kind", "string"], ["created_at", "date"], ["updated_at", "date"]
       ]
    end
  end

  scenario "Import a file when the schema is wrong" do
    post_json api_tables_url, {
               :name => "Twitts",
               :schema => "url varchar(255) not null, login varchar(255), country varchar(255), \"followers count\" integer",
               :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
             }
    response.status.should == 400
  end

  scenario "Create a new table specifing an schema and a file from which import data" do
    post_json api_tables_url, {
               :name => "Twitts",
               :schema => "url varchar(255) not null, login varchar(255), country varchar(255), \"followers count\" integer, foo varchar(255)",
               :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
              }

    response.status.should be_success
  end

  scenario "Get a table metadata information" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    get_json api_table_url(table1.name)
    parse_json(response) do |r|
      r.status.should be_success
      r.body.should == {
        :id => table1.id,
        :name => "my_table_1",
        :privacy => "PUBLIC",
        :tags => "tag 1,tag 2,tag 3",
        :schema => default_schema
      }
    end
  end

  scenario "Update the metadata of a table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    put_json api_table_url(table1.name), {:name => "my_table_2", :tags => "bars,disco", :privacy => Table::PRIVATE}
    parse_json(response) do |r|
      r.status.should be_success
      r.body.should == {
        :id => table1.id,
        :name => "my_table_2",
        :privacy => "PRIVATE",
        :tags => "bars,disco",
        :schema => default_schema
      }
    end
  end

  scenario "Update with bad values the metadata of a table" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    put_json api_table_url(table1.name), {:privacy => "bad privacy value"}
    parse_json(response) do |r|
      r.status.should == 400
    end

    put_json api_table_url(table1.name), {:name => ""}
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:name].should == "untitle_table"
    end
  end

  scenario "Delete a table of mine" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json api_table_url(table1.name)
    parse_json(response) do |r|
      r.status.should be_success
    end
  end

  scenario "Delete a table of another user" do
    another_user = create_user
    table1 = create_table :user_id => another_user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    delete_json api_table_url(table1.name)
    parse_json(response) do |r|
      r.status.should == 404
    end
  end
  
  scenario "Update a table and set the lat and lot columns to nil" do
    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"

    put_json api_table_url(table1.name), {
      :latitude_column => "nil",
      :longitude_column => "nil"
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:schema].should include(["latitude", "number"])
      r.body[:schema].should include(["longitude", "number"])
    end
    
    put_json api_table_url(table1.name), {
      :address_column => "name"
    }
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:schema].should include(["name", "string", "address"])
    end
  end

  # ------
  # TODO
  #
  # scenario "Create a new table from importing file twitters.csv" do
  #   user = create_user
  #
  #   authenticate_api user
  #
  #   post_json "/api/json/tables", {
  #                   :name => "Twitts",
  #                   :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
  #              }
  #   response.status.should == 200
  #   response.location.should =~ /tables\/(\d+)$/
  #   json_response = JSON(response.body)
  #   json_response['id'].should == response.location.match(/\/(\d+)$/)[1].to_i
  #
  #   get_json "/api/json/tables/#{json_response['id']}?rows_per_page=10"
  #   response.status.should == 200
  #   json_response = JSON(response.body)
  #   json_response['total_rows'].should == 7
  #   row0 = json_response['rows'][0].symbolize_keys
  #   row0[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
  #   row0[:login].should == "vzlaturistica "
  #   row0[:country].should == " Venezuela "
  #   row0[:followers_count].should == 211
  # end
  #
  # scenario "Create a new table from importing file import_csv_1.csv" do
  #   user = create_user
  #
  #   authenticate_api user
  #
  #   post_json "/api/json/tables", {
  #                   :name => "Twitts",
  #                   :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
  #              }
  #   response.status.should == 200
  #   response.location.should =~ /tables\/(\d+)$/
  #   json_response = JSON(response.body)
  #   json_response['id'].should == response.location.match(/\/(\d+)$/)[1].to_i
  #
  #   get_json "/api/json/tables/#{json_response['id']}?rows_per_page=10"
  #   response.status.should == 200
  #   json_response = JSON(response.body)
  #   json_response['total_rows'].should == 100
  #   row = json_response['rows'][6].symbolize_keys
  #   row[:id].should == 6
  #   row[:name_of_species].should == "Laetmonice producta 6"
  #   row[:kingdom].should == "Animalia"
  #   row[:family].should == "Aphroditidae"
  #   row[:lat].should == 0.2
  #   row[:lon].should == 2.8
  #   row[:views].should == 540
  # end
  #
  # scenario "Create a new table from importing file import_csv_1.csv" do
  #   user = create_user
  #
  #   authenticate_api user
  #
  #   post_json "/api/json/tables", {
  #                   :name => "Twitts",
  #                   :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
  #              }
  #   response.status.should == 200
  #   response.location.should =~ /tables\/(\d+)$/
  #   json_response = JSON(response.body)
  #   json_response['id'].should == response.location.match(/\/(\d+)$/)[1].to_i
  #
  #   get_json "/api/json/tables/#{json_response['id']}?rows_per_page=10"
  #   response.status.should == 200
  #   json_response = JSON(response.body)
  #   json_response['total_rows'].should == 100
  #   row = json_response['rows'][6].symbolize_keys
  #   row[:id].should == 6
  #   row[:name_of_species].should == "Laetmonice producta 6"
  #   row[:kingdom].should == "Animalia"
  #   row[:family].should == "Aphroditidae"
  #   row[:lat].should == 0.2
  #   row[:lon].should == 2.8
  #   row[:views].should == 540
  # end
  #
  # scenario "Create a new table from importing file import_csv_2.csv" do
  #   user = create_user
  #
  #   authenticate_api user
  #
  #   post_json "/api/json/tables", {
  #                   :name => "Twitts",
  #                   :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_2.csv", "text/csv")
  #              }
  #   response.status.should == 200
  #   response.location.should =~ /tables\/(\d+)$/
  #   json_response = JSON(response.body)
  #   json_response['id'].should == response.location.match(/\/(\d+)$/)[1].to_i
  #
  #   get_json "/api/json/tables/#{json_response['id']}?rows_per_page=10"
  #   response.status.should == 200
  #   json_response = JSON(response.body)
  #   json_response['total_rows'].should == 100
  #   row = json_response['rows'][6].symbolize_keys
  #   row[:id].should == 6
  #   row[:name_of_specie].should == "Laetmonice producta 6"
  #   row[:kingdom].should == "Animalia"
  #   row[:family].should == "Aphroditidae"
  #   row[:lat].should == 0.2
  #   row[:lon].should == 2.8
  #   row[:views].should == 540
  # end
  #
  # scenario "Create a new table from importing file import_csv_3.csv" do
  #   user = create_user
  #
  #   authenticate_api user
  #
  #   post_json "/api/json/tables", {
  #                   :name => "Twitts",
  #                   :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_3.csv", "text/csv")
  #              }
  #   response.status.should == 200
  #   response.location.should =~ /tables\/(\d+)$/
  #   json_response = JSON(response.body)
  #   json_response['id'].should == response.location.match(/\/(\d+)$/)[1].to_i
  #
  #   get_json "/api/json/tables/#{json_response['id']}?rows_per_page=10"
  #   response.status.should == 200
  #   json_response = JSON(response.body)
  #   json_response['total_rows'].should == 100
  #   row = json_response['rows'][6].symbolize_keys
  #   row[:id].should == 6
  #   row[:name_of_specie].should == "Laetmonice producta 6"
  #   row[:kingdom].should == "Animalia"
  #   row[:family].should == "Aphroditidae"
  #   row[:lat].should == 0.2
  #   row[:lon].should == 2.8
  #   row[:views].should == 540
  # end
  #
  # scenario "Create a new table from importing file import_csv_4.csv" do
  #   user = create_user
  #
  #   authenticate_api user
  #
  #   post_json "/api/json/tables", {
  #                   :name => "Twitts",
  #                   :file => Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_4.csv", "text/csv")
  #              }
  #   response.status.should == 200
  #   response.location.should =~ /tables\/(\d+)$/
  #   json_response = JSON(response.body)
  #   json_response['id'].should == response.location.match(/\/(\d+)$/)[1].to_i
  #
  #   get_json "/api/json/tables/#{json_response['id']}?rows_per_page=10"
  #   response.status.should == 200
  #   json_response = JSON(response.body)
  #   json_response['total_rows'].should == 100
  #   row = json_response['rows'][6].symbolize_keys
  #   row[:id].should == 6
  #   row[:name_of_specie].should == "Laetmonice producta 6"
  #   row[:kingdom].should == "Animalia"
  #   row[:family].should == "Aphroditidae"
  #   row[:lat].should == 0.2
  #   row[:lon].should == 2.8
  #   row[:views].should == 540
  # end
  # ------------------------------------




  #
  # scenario "Update the geometry of a row in a table with latitud and longitude geometry and bad address" do
  #   user = create_user
  #   table = create_table :user_id => user.id
  #
  #   user.in_database do |user_database|
  #     10.times do
  #       user_database.run("INSERT INTO \"#{table.name}\" (Name,Latitude,Longitude,Description) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude},'#{String.random(100)}')")
  #     end
  #   end
  #
  #   authenticate_api user
  #
  #   row = table.to_json[:rows][0]
  #   old_lat = row[:latitude]
  #   old_lon = row[:longitude]
  #
  #   new_latitude  = 3.769
  #   new_longitude = 40.321
  #
  #   put_json "/api/json/tables/#{table.id}/update_geometry/1", { :lat => new_latitude, :lon => new_longitude, :address => "bla bla bla" }
  #   response.status.should == 200
  #
  #   table.reload
  #   row = table.to_json[:rows][0]
  #   row[:latitude].should  == new_latitude
  #   row[:longitude].should == new_longitude
  #
  #   query_result = user.run_query("select ST_X(ST_Transform(the_geom, 4326)) as lon, ST_Y(ST_Transform(the_geom, 4326)) as lat from #{table.name} where cartodb_id = #{row[:cartodb_id]}")
  #   query_result[:rows][0][:lon].to_s.should match /^40\.32/
  #   query_result[:rows][0][:lat].to_s.should match /^3\.76/
  # end
  #
  # scenario "Update the geometry of a row in a table with latitud and longitude geometry without address" do
  #   user = create_user
  #   table = create_table :user_id => user.id
  #
  #   user.in_database do |user_database|
  #     10.times do
  #       user_database.run("INSERT INTO \"#{table.name}\" (Name,Latitude,Longitude,Description) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude},'#{String.random(100)}')")
  #     end
  #   end
  #
  #   authenticate_api user
  #
  #   row = table.to_json[:rows][0]
  #   old_lat = row[:latitude]
  #   old_lon = row[:longitude]
  #
  #   new_latitude  = 3.769
  #   new_longitude = 40.321
  #
  #   put_json "/api/json/tables/#{table.id}/update_geometry/1", { :lat => new_latitude, :lon => new_longitude }
  #   response.status.should == 200
  #
  #   table.reload
  #   row = table.to_json[:rows][0]
  #   row[:latitude].should  == new_latitude
  #   row[:longitude].should == new_longitude
  #
  #   query_result = user.run_query("select ST_X(ST_Transform(the_geom, 4326)) as lon, ST_Y(ST_Transform(the_geom, 4326)) as lat from #{table.name} where cartodb_id = #{row[:cartodb_id]}")
  #   query_result[:rows][0][:lon].to_s.should match /^40\.32/
  #   query_result[:rows][0][:lat].to_s.should match /^3\.76/
  # end
  #
  # scenario "Update the geometry of a row in a table with address geometry" do
  #   res_mock = mock()
  #   res_mock.stubs(:body).returns("")
  #   Net::HTTP.stubs(:start).returns(res_mock)
  #
  #   raw_json = {"status"=>"OK", "results"=>[{"types"=>["street_address"], "formatted_address"=>"Calle de Manuel Fernández y González, 8, 28014 Madrid, Spain", "address_components"=>[{"long_name"=>"8", "short_name"=>"8", "types"=>["street_number"]}, {"long_name"=>"Calle de Manuel Fernández y González", "short_name"=>"Calle de Manuel Fernández y González", "types"=>["route"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["locality", "political"]}, {"long_name"=>"Community of Madrid", "short_name"=>"M", "types"=>["administrative_area_level_2", "political"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["administrative_area_level_1", "political"]}, {"long_name"=>"Spain", "short_name"=>"ES", "types"=>["country", "political"]}, {"long_name"=>"28014", "short_name"=>"28014", "types"=>["postal_code"]}], "geometry"=>{"location"=>{"lat"=>40.4151476, "lng"=>-3.6994168}, "location_type"=>"RANGE_INTERPOLATED", "viewport"=>{"southwest"=>{"lat"=>40.4120053, "lng"=>-3.7025647}, "northeast"=>{"lat"=>40.4183006, "lng"=>-3.6962695}}, "bounds"=>{"southwest"=>{"lat"=>40.4151476, "lng"=>-3.6994174}, "northeast"=>{"lat"=>40.4151583, "lng"=>-3.6994168}}}}]}
  #   JSON.stubs(:parse).returns(raw_json)
  #
  #   user = create_user
  #   table = new_table
  #   table.user_id = user.id
  #   table.force_schema = "latitude float, longitude float, address varchar"
  #   table.save
  #
  #   user.in_database do |user_database|
  #     10.times do
  #       user_database.run("INSERT INTO \"#{table.name}\" (Address,Latitude,Longitude) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude})")
  #     end
  #   end
  #
  #   authenticate_api user
  #
  #   table.set_address_column!(:address)
  #
  #   new_latitude  = 3.769
  #   new_longitude = 40.321
  #
  #   put_json "/api/json/tables/#{table.id}/update_geometry/1", { :lat => new_latitude, :lon => new_longitude, :address => "Hortaleza 48, Madrid" }
  #   response.status.should == 200
  #
  #   table.reload
  #   row = table.to_json[:rows][0]
  #   row[:address].should == "Hortaleza 48, Madrid"
  #
  #   query_result = user.run_query("select ST_X(ST_Transform(the_geom, 4326)) as lon, ST_Y(ST_Transform(the_geom, 4326)) as lat from #{table.name} where cartodb_id = #{row[:cartodb_id]}")
  #   query_result[:rows][0][:lon].to_s.should match /^40\.32/
  #   query_result[:rows][0][:lat].to_s.should match /^3\.76/
  # end
  #
  # scenario "Get the address column values paginated" do
  #   res_mock = mock()
  #   res_mock.stubs(:body).returns("")
  #   Net::HTTP.stubs(:start).returns(res_mock)
  #
  #   user = create_user
  #   table = new_table
  #   table.user_id = user.id
  #   table.force_schema = "latitude float, longitude float, address varchar"
  #   table.save
  #
  #   table.set_address_column!(:address)
  #
  #   user.in_database do |user_database|
  #     10.times do
  #       user_database.run("INSERT INTO \"#{table.name}\" (Address,Latitude,Longitude) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude})")
  #     end
  #   end
  #
  #   authenticate_api user
  #
  #   get_json "/api/json/tables/#{table.id}/addresses"
  #   response.status.should == 200
  #   json_response = JSON(response.body)
  #   json_response['total_rows'].should == 10
  #   json_response['columns'].should == ["cartodb_id", "address"]
  #   json_response['rows'][0]['cartodb_id'].should == 1
  #
  #   get_json "/api/json/tables/#{table.id}/addresses", {:page => 2, :per_page => 3}
  #   response.status.should == 200
  #   json_response = JSON(response.body)
  #   json_response['total_rows'].should == 3
  #   json_response['columns'].should == ["cartodb_id", "address"]
  #   json_response['rows'][0]['cartodb_id'].should == 4
  # end

end
# coding: UTF-8

require 'spec_helper'

describe Table do

  it "should have a name and a user_id" do
    table = Table.new
    table.should_not be_valid
    table.errors.on(:user_id).should_not be_nil
    table.name.should == "untitle_table"
  end

  it "should set a default name different than the previous" do
    user = create_user
    table = Table.new
    table.user_id = user.id
    table.save
    table.name.should == "untitle_table"

    table2 = Table.new
    table2.user_id = user.id
    table2.save.reload
    table2.name.should == "untitle_table_2"
  end

  it "should have a privacy associated and it should be private by default" do
    table = create_table
    table.privacy.should_not be_nil
    table.should_not be_private
  end

  it "should be associated to a database table" do
    user = create_user
    table = create_table :name => 'Wadus table', :user_id => user.id
    Rails::Sequel.connection.table_exists?(table.name.to_sym).should be_false
    user.in_database do |user_database|
      user_database.table_exists?(table.name.to_sym).should be_true
    end
  end

  it "should rename a database table when the attribute name is modified" do
    user = create_user
    table = create_table :name => 'Wadus table', :user_id => user.id
    Rails::Sequel.connection.table_exists?(table.name.to_sym).should be_false
    user.in_database do |user_database|
      user_database.table_exists?(table.name.to_sym).should be_true
    end
    table.name = 'Wadus table #2'
    table.save
    user.in_database do |user_database|
      user_database.table_exists?('wadus_table'.to_sym).should be_false
      user_database.table_exists?('wadus_table_2'.to_sym).should be_true
    end
  end

  pending "has a last_updated attribute that is updated with every operation on the database" do
  end

  it "has a default schema" do
    table = create_table
    table.schema.should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"],
      [:description, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    table.schema(:cartodb_types => true).should == [
      [:cartodb_id, "number"], [:name, "string"], [:latitude, "number", "latitude"], [:longitude, "number", "longitude"],
      [:description, "string"], [:created_at, "date"], [:updated_at, "date"]
    ]
  end

  it "has a to_json method that allows to fetch rows with pagination" do
    user = create_user
    table = create_table :user_id => user.id

    table.to_json[:total_rows].should == 0
    table.to_json[:columns].should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"],
      [:description, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    table.to_json[:rows].should be_empty

    10.times do
      user.run_query("INSERT INTO \"#{table.name}\" (Name,Latitude,Longitude,Description) VALUES
                        ('#{String.random(10)}',#{rand(100000).to_f / 100.0}, #{rand(100000).to_f / 100.0},'#{String.random(100)}')")
    end

    table.to_json[:total_rows].should == 10
    table.to_json[:rows].size.should == 10

    content = user.run_query("select * from \"#{table.name}\"")[:rows]

    table.to_json(:rows_per_page => 1)[:rows].size.should == 1
    table.to_json(:rows_per_page => 1)[:rows].first.slice(:name, :latitude, :longitude, :description).
      should == content[0].slice(:name, :latitude, :longitude, :description)
    table.to_json(:rows_per_page => 1)[:rows].first.should == table.to_json(:rows_per_page => 1, :page => 0)[:rows].first
    table.to_json(:rows_per_page => 1, :page => 1)[:rows].first.slice(:name, :latitude, :longitude, :description).
      should == content[1].slice(:name, :latitude, :longitude, :description)
    table.to_json(:rows_per_page => 1, :page => 2)[:rows].first.slice(:name, :latitude, :longitude, :description).
      should == content[2].slice(:name, :latitude, :longitude, :description)
  end

  it "has a toggle_privacy! method to toggle the table privacy" do
    user = create_user
    table = create_table :user_id => user.id, :privacy => Table::PRIVATE
    table.should be_private

    table.toggle_privacy!
    table.reload
    table.should_not be_private

    table.toggle_privacy!
    table.reload
    table.should be_private
  end

  it "can be associated to many tags" do
    user = create_user
    table = create_table :user_id => user.id, :tags => "tag 1, tag 2,tag 3, tag 3"
    Tag.count.should == 3
    tag1 = Tag[:name => 'tag 1']
    tag1.table_id.should == table.id
    tag1.user_id.should == user.id
    tag2 = Tag[:name => 'tag 2']
    tag2.user_id.should == user.id
    tag2.table_id.should == table.id
    tag3 = Tag[:name => 'tag 3']
    tag3.user_id.should == user.id
    tag3.table_id.should == table.id

    table.tags = "tag 1"
    table.save_changes
    Tag.count.should == 1
    tag1 = Tag[:name => 'tag 1']
    tag1.table_id.should == table.id
    tag1.user_id.should == user.id

    table.tags = "    "
    table.save_changes
    Tag.count.should == 0
  end

  it "can add a column of a CartoDB::TYPE type" do
    table = create_table
    table.schema.should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"],
      [:description, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]

    resp = table.add_column!(:name => "my new column", :type => "number")
    resp.should == {:name => "my_new_column", :type => "integer", :cartodb_type => "number"}
    table.reload
    table.schema.should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"],
      [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "integer"],
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
  end

  it "can modify a column using a CartoDB::TYPE type" do
    table = create_table
    table.schema.should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"],
      [:description, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]

    resp = table.modify_column!(:name => "latitude", :type => "string")
    resp.should == {:name => "latitude", :type => "varchar", :cartodb_type => "string"}
  end

  it "can modify it's schema" do
    table = create_table
    table.schema.should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"],
      [:longitude, "double precision", "longitude"], [:description, "text"], [:created_at, "timestamp"],
      [:updated_at, "timestamp"]
    ]

    lambda {
      table.add_column!(:name => "my column with bad type", :type => "textttt")
    }.should raise_error(CartoDB::InvalidType)

    resp = table.add_column!(:name => "my new column", :type => "integer")
    resp.should == {:name => 'my_new_column', :type => 'integer', :cartodb_type => 'number'}
    table.reload
    table.schema.should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"],
      [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "integer"],
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]

    resp = table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "text")
    resp.should == {:name => 'my_new_column_new_name', :type => 'text', :cartodb_type => 'string'}
    table.reload
    table.schema.should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column_new_name, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    resp = table.modify_column!(:old_name => "my_new_column_new_name", :new_name => "my new column")
    resp.should == {:name => 'my_new_column', :type => nil, :cartodb_type => nil}
    table.reload
    table.schema.should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    resp = table.modify_column!(:name => "my_new_column", :type => "text")
    resp.should == {:name => 'my_new_column', :type => 'text', :cartodb_type => 'string'}
    table.reload
    table.schema.should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    table.drop_column!(:name => "description")
    table.reload
    table.schema.should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    lambda {
      table.drop_column!(:name => "description")
    }.should raise_error
    table.reload
    table.schema.should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]
  end

  it "cannot modify :cartodb_id column" do
    table = create_table
    original_schema = table.schema

    lambda {
      table.modify_column!(:old_name => "cartodb_id", :new_name => "new_id", :type => "integer")
    }.should raise_error
    table.reload
    table.schema.should == original_schema

    lambda {
      table.modify_column!(:old_name => "cartodb_id", :new_name => "cartodb_id", :type => "float")
    }.should raise_error
    table.reload
    table.schema.should == original_schema

    lambda {
      table.drop_column!(:name => "cartodb_id")
    }.should raise_error
    table.reload
    table.schema.should == original_schema
  end

  it "should be able to modify it's schema with castings that the DB engine doesn't support" do
    table = create_table
    table.schema.should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    table.add_column!(:name => "my new column", :type => "text")
    table.reload
    table.schema.should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "integer", :force_value => "NULL")
    table.reload
    table.schema.should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column_new_name, "integer"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]
  end

  it "should be able to insert a new row" do
    table = create_table
    table.rows_counted.should == 0
    table.insert_row!({:name => String.random(10), :location => Point.from_x_y(1,1).as_ewkt, :description => "", :not_existing_col => 33})
    table.reload
    table.rows_counted.should == 1

    table.insert_row!({:location => Point.from_x_y(1,1).as_ewkt, :description => "My description"})
    table.reload
    table.rows_counted.should == 2

    table.insert_row!({})
    table.reload
    table.rows_counted.should == 2

    table.insert_row!({:not_existing => "bad value"})
    table.reload
    table.rows_counted.should == 2
  end

  it "should be able to update a row" do
    table = create_table
    table.insert_row!({:name => String.random(10), :location => Point.from_x_y(1,1).as_ewkt, :description => ""})
    row = table.to_json(:rows_per_page => 1, :page => 0)[:rows].first
    row[:description].should be_blank

    table.update_row!(row[:cartodb_id], :non_existing => 'ignore it, please', :description => "Description 123")
    table.reload
    row = table.to_json(:rows_per_page => 1, :page => 0)[:rows].first
    row[:description].should == "Description 123"
  end

  it "should increase the tables_count counter" do
    user = create_user
    user.tables_count.should == 0

    table = create_table :user_id => user.id
    user.reload
    user.tables_count.should == 1
  end

  it "should be removed removing related entities and updating the denormalized counters" do
    user = create_user
    table = create_table :user_id => user.id, :tags => 'tag 1, tag2'

    table.destroy
    user.reload
    user.tables_count.should == 0
    Tag.count.should == 0
    Table.count == 0
  end

  it "can be created with a given schema if it is valid" do
    table = new_table
    table.force_schema = "code char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
    table.save
    table.schema.should == [[:cartodb_id, "integer"], [:code, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"], [:kind, "character varying(10)"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]
  end

  it "should sanitize columns from a given schema" do
    table = new_table
    table.force_schema = "\"code wadus\" char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
    table.save
    table.schema.should == [[:cartodb_id, "integer"], [:code_wadus, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"], [:kind, "character varying(10)"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]
  end

  it "should import a CSV if the schema is given and is valid" do
    table = new_table
    table.force_schema = "url varchar(255) not null, login varchar(255), country varchar(255), \"followers count\" integer, foo varchar(255)"
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.save

    table.rows_counted.should == 7
    row0 = table.to_json[:rows][0]
    row0[:cartodb_id].should == 1
    row0[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
    row0[:login].should == "vzlaturistica "
    row0[:country].should == " Venezuela "
    row0[:followers_count].should == 211
  end

  it "should guess the schema from import file import_csv_1.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
    table.force_schema.should be_blank
    table.guess_schema
    table.force_schema.should == "id integer, name_of_species varchar, kingdom varchar, family varchar, lat float, lon float, views integer"
  end

  it "should guess the schema from import file import_csv_2.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_2.csv", "text/csv")
    table.force_schema.should be_blank
    table.guess_schema
    table.force_schema.should == "id integer, name_of_specie varchar, kingdom varchar, family varchar, lat float, lon float, views integer"
  end

  it "should guess the schema from import file import_csv_3.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_3.csv", "text/csv")
    table.force_schema.should be_blank
    table.guess_schema
    table.force_schema.should == "id integer, name_of_specie varchar, kingdom varchar, family varchar, lat float, lon float, views integer"
  end

  it "should guess the schema from import file twitters.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.force_schema.should be_blank
    table.guess_schema
    table.force_schema.should == "url varchar, login varchar, country varchar, followers_count integer, unknow_name_1 varchar"
  end

  it "should import file twitters.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.save
    table.reload

    table.rows_counted.should == 7
    table.schema.should == [[:cartodb_id, "integer"], [:url, "character varying"], [:login, "character varying"], [:country, "character varying"], [:followers_count, "integer"], [:unknow_name_1, "character varying"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]
    row = table.to_json[:rows][0]
    row[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
    row[:login].should == "vzlaturistica "
    row[:country].should == " Venezuela "
    row[:followers_count].should == 211
  end

  it "should import file import_csv_1.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.to_json[:rows][6]
    row[:cartodb_id] == 6
    row[:id].should == 6
    row[:name_of_species].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import file import_csv_2.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_2.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.to_json[:rows][6]
    row[:id].should == 6
    row[:name_of_specie].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import file import_csv_3.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_3.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.to_json[:rows][6]
    row[:id].should == 6
    row[:name_of_specie].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import file import_csv_4.csv" do
    Table.send(:public, *Table.private_instance_methods)
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_4.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.to_json[:rows][6]
    row[:id].should == 6
    row[:name_of_specie].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import data from an external url returning JSON data" do
    json = JSON.parse(File.read("#{Rails.root}/spec/support/bus_gijon.json"))
    JSON.stubs(:parse).returns(json)
    table = new_table
    table.import_from_external_url = "http://externaldata.com/bus_gijon.json"
    table.save

    table.rows_counted.should == 7
    table.schema.should == [[:cartodb_id, "integer"], [:idautobus, "integer"], [:utmx, "integer"],
        [:utmy, "integer"], [:horaactualizacion, "character varying"], [:fechaactualizacion, "character varying"],
        [:idtrayecto, "integer"], [:idparada, "integer"], [:minutos, "integer"], [:distancia, "double precision"],
        [:idlinea, "integer"], [:matricula, "character varying"], [:modelo, "character varying"],
        [:ordenparada, "integer"], [:idsiguienteparada, "integer"], [:created_at, "timestamp"],
        [:updated_at, "timestamp"]
    ]
    row = table.to_json[:rows][0]
    row[:cartodb_id].should == 1
    row[:idautobus].should == 330
    row[:horaactualizacion].should == "14:23:10"
    row[:idparada] == 34
  end

  it "should import data from an external url returning JSON data and set the geometric fields which are updated on each row updated" do
    user = create_user
    json = JSON.parse(File.read("#{Rails.root}/spec/support/points_json.json"))
    JSON.stubs(:parse).returns(json)
    table = new_table
    table.import_from_external_url = "http://externaldata.com/points_json.json"
    table.user_id = user.id
    table.save

    table.rows_counted.should == 5
    table.schema.should == [[:cartodb_id, "integer"], [:id, "integer"], [:name, "character varying"], [:lat, "double precision"],
        [:lon, "double precision"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    row = table.to_json[:rows][0]
    row[:cartodb_id].should == 1
    row[:name].should == "Hawai"

    table.set_lan_lon_columns!(:lat, :lon)

    # Vizzuality HQ
    current_lat = "40.422546"
    current_lon = "-3.699431"
    query_result = user.run_query("select name, distance_sphere(the_geom, geomfromtext('POINT(#{current_lon} #{current_lat})', 4236)) as distance from #{table.name} order by distance asc")
    query_result[:rows][0][:name].should == "Hawai"
    query_result[:rows][1][:name].should == "El Pico"

    # Plaza Santa Ana
    current_lat = "40.414689"
    current_lon = "-3.700901"
    query_result = user.run_query("select name, distance_sphere(the_geom, geomfromtext('POINT(#{current_lon} #{current_lat})', 4236)) as distance from #{table.name} order by distance asc")
    query_result[:rows][0][:name].should == "El Lacón"
    query_result[:rows][1][:name].should == "Hawai"
  end

  it "should add an extra column in the schema for latitude and longitude columns" do
    table = create_table
    table.lat_column.should == :latitude
    table.lon_column.should == :longitude
    table.schema.should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"],
      [:longitude, "double precision", "longitude"], [:description, "text"],
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
  end

  it "should set latitude and longitude if the default schema is loaded" do
    table = create_table
    table.lat_column.should == :latitude
    table.lon_column.should == :longitude

    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_4.csv", "text/csv")
    table.save
    table.lat_column.should be_nil
    table.lon_column.should be_nil
  end

  it "should be able to un-set geometry columns" do
    table = create_table
    table.set_lan_lon_columns!(nil, nil)
    table.lon_column.should be_nil
    table.lat_column.should be_nil
  end

  it "should be able to set an address column to a given column" do
    res_mock = mock()
    res_mock.stubs(:body).returns("")
    Net::HTTP.stubs(:start).returns(res_mock)

    raw_json = {"status"=>"OK", "results"=>[{"types"=>["street_address"], "formatted_address"=>"Calle de Manuel Fernández y González, 8, 28014 Madrid, Spain", "address_components"=>[{"long_name"=>"8", "short_name"=>"8", "types"=>["street_number"]}, {"long_name"=>"Calle de Manuel Fernández y González", "short_name"=>"Calle de Manuel Fernández y González", "types"=>["route"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["locality", "political"]}, {"long_name"=>"Community of Madrid", "short_name"=>"M", "types"=>["administrative_area_level_2", "political"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["administrative_area_level_1", "political"]}, {"long_name"=>"Spain", "short_name"=>"ES", "types"=>["country", "political"]}, {"long_name"=>"28014", "short_name"=>"28014", "types"=>["postal_code"]}], "geometry"=>{"location"=>{"lat"=>40.4151476, "lng"=>-3.6994168}, "location_type"=>"RANGE_INTERPOLATED", "viewport"=>{"southwest"=>{"lat"=>40.4120053, "lng"=>-3.7025647}, "northeast"=>{"lat"=>40.4183006, "lng"=>-3.6962695}}, "bounds"=>{"southwest"=>{"lat"=>40.4151476, "lng"=>-3.6994174}, "northeast"=>{"lat"=>40.4151583, "lng"=>-3.6994168}}}}]}
    JSON.stubs(:parse).returns(raw_json)

    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, address varchar"
    table.save

    table.set_address_column!(:address)

    table.reload
    table.lat_column.should be_nil
    table.lon_column.should be_nil
    table.address_column.should == :address

    table.insert_row!({:name => 'El Lacón', :address => 'Calle de Manuel Fernández y González 8, Madrid'})

    query_result = user.run_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} limit 1")
    query_result[:rows][0][:lon].should == -3.6994168
    query_result[:rows][0][:lat].should == 40.4151476

    raw_json = {"status"=>"OK", "results"=>[{"types"=>["street_address"], "formatted_address"=>"Calle de la Palma, 72, 28015 Madrid, Spain", "address_components"=>[{"long_name"=>"72", "short_name"=>"72", "types"=>["street_number"]}, {"long_name"=>"Calle de la Palma", "short_name"=>"Calle de la Palma", "types"=>["route"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["locality", "political"]}, {"long_name"=>"Community of Madrid", "short_name"=>"M", "types"=>["administrative_area_level_2", "political"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["administrative_area_level_1", "political"]}, {"long_name"=>"Spain", "short_name"=>"ES", "types"=>["country", "political"]}, {"long_name"=>"28015", "short_name"=>"28015", "types"=>["postal_code"]}], "geometry"=>{"location"=>{"lat"=>40.4268336, "lng"=>-3.7089444}, "location_type"=>"RANGE_INTERPOLATED", "viewport"=>{"southwest"=>{"lat"=>40.4236786, "lng"=>-3.7120931}, "northeast"=>{"lat"=>40.4299739, "lng"=>-3.7057979}}, "bounds"=>{"southwest"=>{"lat"=>40.4268189, "lng"=>-3.7089466}, "northeast"=>{"lat"=>40.4268336, "lng"=>-3.7089444}}}}]}
    JSON.stubs(:parse).returns(raw_json)

    table.update_row!(query_result[:rows][0][:cartodb_id], {:name => 'El Estocolmo', :address => 'Calle de La Palma 72, Madrid'})

    query_result = user.run_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} limit 1")
    query_result[:rows][0][:lon].should == -3.7089444
    query_result[:rows][0][:lat].should == 40.4268336
  end

  it "should add an extra column in the schema for address columns" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, address varchar"
    table.save

    table.set_address_column!(:address)
    table.schema.should == [
      [:cartodb_id, "integer"], [:name, "character varying"], [:address, "character varying", "address"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
  end

  it "should set the_geom in blank when an address can't be geoencoded" do
    raw_json = {"status"=>"ZERO_RESULTS", "results"=>[]}
    JSON.stubs(:parse).returns(raw_json)

    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, address varchar"
    table.save

    table.set_address_column!(:address)

    table.reload
    table.lat_column.should be_nil
    table.lon_column.should be_nil
    table.address_column.should == :address

    table.insert_row!({:name => 'El Lacón', :address => ''})

    query_result = user.run_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} limit 1")
    query_result[:rows][0][:lon].should be_nil
    query_result[:rows][0][:lat].should be_nil

    raw_json = {"status"=>"OK", "results"=>[{"types"=>["street_address"], "formatted_address"=>"Calle de la Palma, 72, 28015 Madrid, Spain", "address_components"=>[{"long_name"=>"72", "short_name"=>"72", "types"=>["street_number"]}, {"long_name"=>"Calle de la Palma", "short_name"=>"Calle de la Palma", "types"=>["route"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["locality", "political"]}, {"long_name"=>"Community of Madrid", "short_name"=>"M", "types"=>["administrative_area_level_2", "political"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["administrative_area_level_1", "political"]}, {"long_name"=>"Spain", "short_name"=>"ES", "types"=>["country", "political"]}, {"long_name"=>"28015", "short_name"=>"28015", "types"=>["postal_code"]}], "geometry"=>{"location"=>{"lat"=>40.4268336, "lng"=>-3.7089444}, "location_type"=>"RANGE_INTERPOLATED", "viewport"=>{"southwest"=>{"lat"=>40.4236786, "lng"=>-3.7120931}, "northeast"=>{"lat"=>40.4299739, "lng"=>-3.7057979}}, "bounds"=>{"southwest"=>{"lat"=>40.4268189, "lng"=>-3.7089466}, "northeast"=>{"lat"=>40.4268336, "lng"=>-3.7089444}}}}]}
    JSON.stubs(:parse).returns(raw_json)

    table.update_row!(query_result[:rows][0][:cartodb_id], {:name => 'El Estocolmo', :address => 'Calle de La Palma 72, Madrid'})

    query_result = user.run_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} limit 1")
    query_result[:rows][0][:lon].should == -3.7089444
    query_result[:rows][0][:lat].should == 40.4268336
  end

end

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
    table.stored_schema.should == ["cartodb_id,integer,number","name,text,string","latitude,double precision,number",
                                   "longitude,double precision,number","description,text,string","created_at,timestamp,date","updated_at,timestamp,date"]
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"],
      [:description, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    table.schema.should == [
      [:cartodb_id, "number"], [:name, "string"], [:latitude, "number", "latitude"], [:longitude, "number", "longitude"],
      [:description, "string"], [:created_at, "date"], [:updated_at, "date"]
    ]
  end

  it "has a records method that allows to fetch rows with pagination" do
    user = create_user
    table = create_table :user_id => user.id

    table.records[:total_rows].should == 0
    table.records[:rows].should be_empty

    user.in_database do |user_database|
      10.times do
        user_database.run("INSERT INTO \"#{table.name}\" (Name,Latitude,Longitude,Description) VALUES
                              ('#{String.random(10)}',-3.4234213, 150.323,'#{String.random(100)}')")
      end
    end

    table.records[:total_rows].should == 10
    table.records[:rows].size.should == 10

    content = user.run_query("select * from \"#{table.name}\"")[:rows]

    table.records(:rows_per_page => 1)[:rows].size.should == 1
    table.records(:rows_per_page => 1)[:rows].first.slice(:name, :latitude, :longitude, :description).
      should == content[0].slice(:name, :latitude, :longitude, :description)
    table.records(:rows_per_page => 1)[:rows].first.should == table.records(:rows_per_page => 1, :page => 0)[:rows].first
    table.records(:rows_per_page => 1, :page => 1)[:rows].first.slice(:name, :latitude, :longitude, :description).
      should == content[1].slice(:name, :latitude, :longitude, :description)
    table.records(:rows_per_page => 1, :page => 2)[:rows].first.slice(:name, :latitude, :longitude, :description).
      should == content[2].slice(:name, :latitude, :longitude, :description)
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
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"],
      [:description, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]

    resp = table.add_column!(:name => "my new column", :type => "number")
    resp.should == {:name => "my_new_column", :type => "smallint", :cartodb_type => "number"}
    table.reload
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"],
      [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "smallint"],
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
  end

  it "can modify a column using a CartoDB::TYPE type" do
    table = create_table
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"],
      [:description, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]

    resp = table.modify_column!(:name => "latitude", :type => "string")
    resp.should == {:name => "latitude", :type => "varchar", :cartodb_type => "string"}
  end

  it "can modify it's schema" do
    table = create_table
    table.schema(:cartodb_types => false).should == [
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
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"],
      [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "integer"],
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]

    resp = table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "text")
    resp.should == {:name => 'my_new_column_new_name', :type => 'text', :cartodb_type => 'string'}
    table.reload
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column_new_name, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    resp = table.modify_column!(:old_name => "my_new_column_new_name", :new_name => "my new column")
    resp.should == {:name => 'my_new_column', :type => "text", :cartodb_type => "string"}
    table.reload
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    resp = table.modify_column!(:name => "my_new_column", :type => "text")
    resp.should == {:name => 'my_new_column', :type => 'text', :cartodb_type => 'string'}
    table.reload
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    table.drop_column!(:name => "description")
    table.reload
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    lambda {
      table.drop_column!(:name => "description")
    }.should raise_error
    table.reload
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]
  end

  it "cannot modify :cartodb_id column" do
    table = create_table
    original_schema = table.schema(:cartodb_types => false)

    lambda {
      table.modify_column!(:old_name => "cartodb_id", :new_name => "new_id", :type => "integer")
    }.should raise_error
    table.reload
    table.schema(:cartodb_types => false).should == original_schema

    lambda {
      table.modify_column!(:old_name => "cartodb_id", :new_name => "cartodb_id", :type => "float")
    }.should raise_error
    table.reload
    table.schema(:cartodb_types => false).should == original_schema

    lambda {
      table.drop_column!(:name => "cartodb_id")
    }.should raise_error
    table.reload
    table.schema(:cartodb_types => false).should == original_schema
  end

  it "should be able to modify it's schema with castings that the DB engine doesn't support" do
    table = create_table
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    table.add_column!(:name => "my new column", :type => "text")
    table.reload
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column, "text"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    pk = table.insert_row!(:name => "Text", :my_new_column => "1")

    table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "integer", :force_value => "NULL")
    table.reload
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:name, "text"], [:latitude, "double precision", "latitude"], [:longitude, "double precision", "longitude"], [:description, "text"], [:my_new_column_new_name, "integer"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]

    rows = table.records
    rows[:rows][0][:my_new_column_new_name].should == 1
  end

  it "should be able to insert a new row" do
    table = create_table
    table.rows_counted.should == 0
    primary_key = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
    table.reload
    table.rows_counted.should == 1
    primary_key.should == table.records(:rows_per_page => 1)[:rows].first[:cartodb_id]

    lambda {
      table.insert_row!({})
    }.should_not raise_error(CartoDB::EmtpyAttributes)

    lambda {
      table.insert_row!({:non_existing => "bad value"})
    }.should raise_error(CartoDB::InvalidAttributes)
  end
  
  it "should be able to insert a row with a geometry value" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.save
    table.reload
    
    table.set_lat_lon_columns!(nil, nil)
    
    lat = Float.random_latitude
    lon = Float.random_longitude
    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    pk = table.insert_row!({:name => "First check_in", :latitude => lat, :longitude => lon, :the_geom => the_geom})
    
    query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end

  it "should be able to update a row" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, description varchar, time timestamp"
    table.save

    table.insert_row!({:name => String.random(10), :description => "", :time => "2010-10-13 10:46:32"})
    row = table.records(:rows_per_page => 1, :page => 0)[:rows].first
    row[:description].should be_blank
    row[:time].should == "2010-10-13 10:46:32"

    table.update_row!(row[:cartodb_id], :description => "Description 123")

    lambda {
      table.update_row!(row[:cartodb_id], :non_existing => 'ignore it, please', :description => "Description 123")
    }.should raise_error(CartoDB::InvalidAttributes)
  end
  
  it "should be able to update a row with a geometry value" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.save
    table.reload
    
    table.set_lat_lon_columns!(nil, nil)

    lat = Float.random_latitude
    lon = Float.random_longitude    
    pk = table.insert_row!({:name => "First check_in", :latitude => lat, :longitude => lon})
    
    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    table.update_row!(pk, {:the_geom => the_geom})
    
    query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end
  
  it "should accept insert and update address_column if an attribute address_column is set" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    table.reload
    table.set_address_column!(:address)

    pk = table.insert_row!({:address_column => "Calle Santa Ana 1"})
    query_result = user.run_query("select address from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address].should == "Calle Santa Ana 1"

    table.update_row!(pk, {:address_column => "Calle Santa Ana 2"})
    query_result = user.run_query("select address from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address].should == "Calle Santa Ana 2"
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
    user.in_database{|database| database.table_exists?(table.name).should be_false}
    table.constraints.count.should == 0
  end

  it "can be created with a given schema if it is valid" do
    table = new_table
    table.force_schema = "code char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
    table.save
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:code, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"], [:kind, "character varying(10)"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]
  end

  it "should sanitize columns from a given schema" do
    table = new_table
    table.force_schema = "\"code wadus\" char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
    table.save
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:code_wadus, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"], [:kind, "character varying(10)"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]
  end

  it "should import a CSV if the schema is given and is valid" do
    table = new_table
    table.force_schema = "url varchar(255) not null, login varchar(255), country varchar(255), \"followers count\" integer, foo varchar(255)"
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.save

    table.rows_counted.should == 7
    row0 = table.records[:rows][0]
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
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.save
    table.reload

    table.rows_counted.should == 7
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:url, "character varying"], [:login, "character varying"], [:country, "character varying"], [:followers_count, "integer"], [:unknow_name_1, "character varying"], [:created_at, "timestamp"], [:updated_at, "timestamp"]]
    row = table.records[:rows][0]
    row[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
    row[:login].should == "vzlaturistica "
    row[:country].should == " Venezuela "
    row[:followers_count].should == 211
  end

  it "should import file import_csv_1.csv" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.records[:rows][6]
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
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_2.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.records[:rows][6]
    row[:id].should == 6
    row[:name_of_specie].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import file import_csv_3.csv" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_3.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.records[:rows][6]
    row[:id].should == 6
    row[:name_of_specie].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end

  it "should import file import_csv_4.csv" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_4.csv", "text/csv")
    table.save

    table.rows_counted.should == 100
    row = table.records[:rows][6]
    row[:id].should == 6
    row[:name_of_specie].should == "Laetmonice producta 6"
    row[:kingdom].should == "Animalia"
    row[:family].should == "Aphroditidae"
    row[:lat].should == 0.2
    row[:lon].should == 2.8
    row[:views].should == 540
  end
  
  it "should import file ngos.xlsx" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/ngos.xlsx", "application/download")
    table.save
    
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:organization, "character varying"], [:website, "character varying"], [:about, "character varying"], 
      [:organization_s_work_in_haiti, "character varying"], [:calculation_of_number_of_people_reached, "character varying"], 
      [:private_funding, "double precision"], [:relief, "character varying"], [:reconstruction, "character varying"], 
      [:private_funding_spent, "double precision"], [:spent_on_relief, "character varying"], [:spent_on_reconstruction, "character varying"], 
      [:usg_funding, "integer"], [:usg_funding_spent, "integer"], [:other_funding, "integer"], [:other_funding_spent, "integer"], 
      [:international_staff, "integer"], [:national_staff, "integer"], [:us_contact_name, "character varying"], [:us_contact_title, "character varying"], 
      [:us_contact_phone, "character varying"], [:us_contact_e_mail, "character varying"], [:media_contact_name, "character varying"], 
      [:media_contact_title, "character varying"], [:media_contact_phone, "character varying"], [:media_contact_e_mail, "character varying"], 
      [:donation_phone_number, "character varying"], [:donation_address_line_1, "character varying"], [:address_line_2, "character varying"], 
      [:city, "character varying"], [:state, "character varying"], [:zip_code, "integer"], [:donation_website, "character varying"], [:created_at, "timestamp"], 
      [:updated_at, "timestamp"]
    ]
    table.rows_counted.should == 76
  end
  
  it "should import world_merc.zip" do
    table = new_table
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/world_merc.zip", "application/download")
    table.save
    
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:fips, "character varying(2)"], [:iso2, "character varying(2)"], [:iso3, "character varying(3)"], [:un, "smallint"], 
      [:name, "character varying(50)"], [:area, "integer"], [:pop2005, "numeric(10)"], [:region, "smallint"], [:subregion, "smallint"], 
      [:lon, "double precision"], [:lat, "double precision"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    table.rows_counted.should == 245
  end

  it "should import data from an external url returning JSON data" do
    json = JSON.parse(File.read("#{Rails.root}/spec/support/bus_gijon.json"))
    JSON.stubs(:parse).returns(json)
    table = new_table
    table.import_from_external_url = "http://externaldata.com/bus_gijon.json"
    table.save

    table.rows_counted.should == 7
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:idautobus, "integer"], [:utmx, "integer"],
        [:utmy, "integer"], [:horaactualizacion, "character varying"], [:fechaactualizacion, "character varying"],
        [:idtrayecto, "integer"], [:idparada, "integer"], [:minutos, "integer"], [:distancia, "double precision"],
        [:idlinea, "integer"], [:matricula, "character varying"], [:modelo, "character varying"],
        [:ordenparada, "integer"], [:idsiguienteparada, "integer"], [:created_at, "timestamp"],
        [:updated_at, "timestamp"]
    ]
    row = table.records[:rows][0]
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
    table.schema(:cartodb_types => false).should == [[:cartodb_id, "integer"], [:id, "integer"], [:name, "character varying"], [:lat, "double precision"],
        [:lon, "double precision"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    row = table.records[:rows][0]
    row[:cartodb_id].should == 1
    row[:name].should == "Hawai"

    table.set_lat_lon_columns!(:lat, :lon)

    # Vizzuality HQ
    current_lat = "40.422546"
    current_lon = "-3.699431"
    query_result = user.run_query("select name, distance_sphere(st_transform(the_geom, #{CartoDB::SRID}), geomfromtext('POINT(#{current_lon} #{current_lat})', #{CartoDB::SRID})) as distance from #{table.name} order by distance asc")
    query_result[:rows][0][:name].should == "Hawai"
    query_result[:rows][1][:name].should == "El Pico"

    # Plaza Santa Ana
    current_lat = "40.414689"
    current_lon = "-3.700901"
    query_result = user.run_query("select name, distance_sphere(st_transform(the_geom, #{CartoDB::SRID}), geomfromtext('POINT(#{current_lon} #{current_lat})', #{CartoDB::SRID})) as distance from #{table.name} order by distance asc")
    query_result[:rows][0][:name].should == "El Lacón"
    query_result[:rows][1][:name].should == "Hawai"
  end

  it "should add an extra column in the schema for latitude and longitude columns" do
    table = create_table
    table.lat_column.should == :latitude
    table.lon_column.should == :longitude
    table.schema(:cartodb_types => false).should == [
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
    table.set_lat_lon_columns!(nil, nil)
    table.lon_column.should be_nil
    table.lat_column.should be_nil
  end
  
  it "should update the_geom when setting latitude_column and longitude_column new values" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.save
    table.lat_column.should == :latitude
    table.lon_column.should == :longitude
    
    new_lat = Float.random_latitude
    new_lon = Float.random_longitude
    
    pk = table.insert_row!(:name => "element 1", :latitude => new_lat, :longitude => new_lon)
    
    query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % new_lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % new_lat)
  end

  it "should update the_geom when updating latitude_column and longitude_column new values" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.save
    table.lat_column.should == :latitude
    table.lon_column.should == :longitude
    
    new_lat = Float.random_latitude
    new_lon = Float.random_longitude
    
    pk = table.insert_row!(:name => "element 1", :latitude => new_lat, :longitude => new_lon)

    updated_lat = Float.random_latitude
    updated_lon = Float.random_longitude
    
    table.update_row!(pk, {:latitude => updated_lat, :longitude => updated_lon})
    
    query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % updated_lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % updated_lat)
  end

  it "should be able to set an address column to a given column on a empty table" do
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
    
    # TODO
    # geolocating
    # query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} limit 1")
    # query_result[:rows][0][:lon].to_s.should match /^-3\.699416/
    # query_result[:rows][0][:lat].to_s.should match /^40\.415147/
    # 
    # raw_json = {"status"=>"OK", "results"=>[{"types"=>["street_address"], "formatted_address"=>"Calle de la Palma, 72, 28015 Madrid, Spain", "address_components"=>[{"long_name"=>"72", "short_name"=>"72", "types"=>["street_number"]}, {"long_name"=>"Calle de la Palma", "short_name"=>"Calle de la Palma", "types"=>["route"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["locality", "political"]}, {"long_name"=>"Community of Madrid", "short_name"=>"M", "types"=>["administrative_area_level_2", "political"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["administrative_area_level_1", "political"]}, {"long_name"=>"Spain", "short_name"=>"ES", "types"=>["country", "political"]}, {"long_name"=>"28015", "short_name"=>"28015", "types"=>["postal_code"]}], "geometry"=>{"location"=>{"lat"=>40.4268336, "lng"=>-3.7089444}, "location_type"=>"RANGE_INTERPOLATED", "viewport"=>{"southwest"=>{"lat"=>40.4236786, "lng"=>-3.7120931}, "northeast"=>{"lat"=>40.4299739, "lng"=>-3.7057979}}, "bounds"=>{"southwest"=>{"lat"=>40.4268189, "lng"=>-3.7089466}, "northeast"=>{"lat"=>40.4268336, "lng"=>-3.7089444}}}}]}
    # JSON.stubs(:parse).returns(raw_json)
    # 
    # table.update_row!(query_result[:rows][0][:cartodb_id], {:name => 'El Estocolmo', :address => 'Calle de La Palma 72, Madrid'})
    # 
    # query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} limit 1")
    # query_result[:rows][0][:lon].to_s.should match /^\-3\.708944/
    # query_result[:rows][0][:lat].to_s.should match /^40\.426833/
  end

  pending "should be able to set an address column to a given column on a table with data, and that data should be geolocalized" do
    res_mock = mock()
    res_mock.stubs(:body).returns("")
    Net::HTTP.stubs(:start).returns(res_mock)

    raw_json1 = {"status"=>"OK", "results"=>[{"types"=>["street_address"], "formatted_address"=>"Calle de Manuel Fernández y González, 8, 28014 Madrid, Spain", "address_components"=>[{"long_name"=>"8", "short_name"=>"8", "types"=>["street_number"]}, {"long_name"=>"Calle de Manuel Fernández y González", "short_name"=>"Calle de Manuel Fernández y González", "types"=>["route"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["locality", "political"]}, {"long_name"=>"Community of Madrid", "short_name"=>"M", "types"=>["administrative_area_level_2", "political"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["administrative_area_level_1", "political"]}, {"long_name"=>"Spain", "short_name"=>"ES", "types"=>["country", "political"]}, {"long_name"=>"28014", "short_name"=>"28014", "types"=>["postal_code"]}], "geometry"=>{"location"=>{"lat"=>40.4151476, "lng"=>-3.6994168}, "location_type"=>"RANGE_INTERPOLATED", "viewport"=>{"southwest"=>{"lat"=>40.4120053, "lng"=>-3.7025647}, "northeast"=>{"lat"=>40.4183006, "lng"=>-3.6962695}}, "bounds"=>{"southwest"=>{"lat"=>40.4151476, "lng"=>-3.6994174}, "northeast"=>{"lat"=>40.4151583, "lng"=>-3.6994168}}}}]}
    raw_json2 = {"status"=>"OK", "results"=>[{"types"=>["street_address"], "formatted_address"=>"Calle de la Palma, 72, 28015 Madrid, Spain", "address_components"=>[{"long_name"=>"72", "short_name"=>"72", "types"=>["street_number"]}, {"long_name"=>"Calle de la Palma", "short_name"=>"Calle de la Palma", "types"=>["route"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["locality", "political"]}, {"long_name"=>"Community of Madrid", "short_name"=>"M", "types"=>["administrative_area_level_2", "political"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["administrative_area_level_1", "political"]}, {"long_name"=>"Spain", "short_name"=>"ES", "types"=>["country", "political"]}, {"long_name"=>"28015", "short_name"=>"28015", "types"=>["postal_code"]}], "geometry"=>{"location"=>{"lat"=>40.4268336, "lng"=>-3.7089444}, "location_type"=>"RANGE_INTERPOLATED", "viewport"=>{"southwest"=>{"lat"=>40.4236786, "lng"=>-3.7120931}, "northeast"=>{"lat"=>40.4299739, "lng"=>-3.7057979}}, "bounds"=>{"southwest"=>{"lat"=>40.4268189, "lng"=>-3.7089466}, "northeast"=>{"lat"=>40.4268336, "lng"=>-3.7089444}}}}]}
    JSON.stubs(:parse).returns(raw_json1).then.returns(raw_json2)

    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, address varchar"
    table.save

    table.insert_row!({:name => 'El Lacón',     :address => 'Calle de Manuel Fernández y González 8, Madrid'})
    table.insert_row!({:name => 'El Estocolmo', :address => 'Calle de La Palma 72, Madrid'})

    table.set_address_column!(:address)

    query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name}")
    query_result[:rows][0][:lon].to_s.should match /^\-3\.699416/
    query_result[:rows][0][:lat].to_s.should match /^40\.415147/
    query_result[:rows][1][:lon].to_s.should match /^\-3\.708944/
    query_result[:rows][1][:lat].to_s.should match /^40\.426833/
  end

  it "should add an extra column in the schema for address columns" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, address varchar, latitude float, longitude float"
    table.save
    table.lat_column.should == :latitude
    table.lon_column.should == :longitude

    table.set_address_column!(:address)
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:name, "character varying"], [:address, "character varying", "address"],
      [:latitude, "double precision"], [:longitude, "double precision"],
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
  end
  
  it "allow to set the address column as an aggregation of different columns" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, address varchar, region varchar, country varchar"
    table.save
    
    table.insert_row!({:name => 'El Lacón', :address => 'Calle de Manuel Fernández y González 8', :region => 'Madrid', :country => 'Spain'})
    table.insert_row!({:name => 'El Tío Timón', :address => 'Calle de Manuela Malasaña 8', :region => 'Madrid', :country => 'Spain'})
    table.insert_row!({:name => 'El Rincón', :address => 'Calle de Manuel Candela 8', :region => 'Valencia', :country => 'Spain'})

    table.set_address_column!("address,region,country")
    table.reload
    
    table.schema(:cartodb_types => false).should == [
      [:cartodb_id, "integer"], [:name, "character varying"], [:address, "character varying"],
      [:region, "character varying"], [:country, "character varying"], [:aggregated_address, "character varying", "address"],
      [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
    table.address_column.should == :aggregated_address
    table.record(3)[:aggregated_address].should == "Calle de Manuel Candela 8,Valencia,Spain"
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

    query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} limit 1")
    query_result[:rows][0][:lon].should be_nil
    query_result[:rows][0][:lat].should be_nil

    # TODO: geolocation
    # raw_json = {"status"=>"OK", "results"=>[{"types"=>["street_address"], "formatted_address"=>"Calle de la Palma, 72, 28015 Madrid, Spain", "address_components"=>[{"long_name"=>"72", "short_name"=>"72", "types"=>["street_number"]}, {"long_name"=>"Calle de la Palma", "short_name"=>"Calle de la Palma", "types"=>["route"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["locality", "political"]}, {"long_name"=>"Community of Madrid", "short_name"=>"M", "types"=>["administrative_area_level_2", "political"]}, {"long_name"=>"Madrid", "short_name"=>"Madrid", "types"=>["administrative_area_level_1", "political"]}, {"long_name"=>"Spain", "short_name"=>"ES", "types"=>["country", "political"]}, {"long_name"=>"28015", "short_name"=>"28015", "types"=>["postal_code"]}], "geometry"=>{"location"=>{"lat"=>40.4268336, "lng"=>-3.7089444}, "location_type"=>"RANGE_INTERPOLATED", "viewport"=>{"southwest"=>{"lat"=>40.4236786, "lng"=>-3.7120931}, "northeast"=>{"lat"=>40.4299739, "lng"=>-3.7057979}}, "bounds"=>{"southwest"=>{"lat"=>40.4268189, "lng"=>-3.7089466}, "northeast"=>{"lat"=>40.4268336, "lng"=>-3.7089444}}}}]}
    # JSON.stubs(:parse).returns(raw_json)
    # 
    # table.update_row!(query_result[:rows][0][:cartodb_id], {:name => 'El Estocolmo', :address => 'Calle de La Palma 72, Madrid'})
    # 
    # query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} limit 1")
    # query_result[:rows][0][:lon].to_s.should match /^\-3\.708944/
    # query_result[:rows][0][:lat].to_s.should match /^40\.426833/
  end

  it "should alter the schema automatically to a a wide range of numbers when inserting" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, age integer"
    table.save

    pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
    table.rows_counted.should == 1

    pk_row2 = table.insert_row!(:name => 'Javi Jam', :age => "25.4")
    table.rows_counted.should == 2

    table.schema(:cartodb_types => false).should include([:age, "real"])
    table.schema.should include([:age, "number"])
  end

  it "should alter the schema automatically to a a wide range of numbers when updating" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, age integer"
    table.save

    pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
    table.rows_counted.should == 1

    pk_row2 = table.update_row!(pk_row1, :name => 'Javi Jam', :age => "25.4")
    table.rows_counted.should == 1

    table.schema(:cartodb_types => false).should include([:age, "real"])
    table.schema.should include([:age, "number"])
  end

  it "should allow to update the geometry of a row" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "latitude float, longitude float, address varchar"
    table.save

    user.in_database do |user_database|
      10.times do
        user_database.run("INSERT INTO \"#{table.name}\" (Address,Latitude,Longitude) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude})")
      end
    end

    table.set_address_column!(:address)

    new_latitude  = 3.769
    new_longitude = 40.321

    table.update_geometry!(1, { :lat => new_latitude, :lon => new_longitude, :address => "Hortaleza 48, Madrid" })
    table.reload
    row = table.records[:rows][0]
    row[:address].should == "Hortaleza 48, Madrid"

    query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} where cartodb_id = #{row[:cartodb_id]}")
    query_result[:rows][0][:lon].to_s.should match /^40\.32/
    query_result[:rows][0][:lat].to_s.should match /^3\.76/
  end

  it "should set to null geometry columns when an address column is set and it is removed" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "latitude float, longitude float, address varchar"
    table.save

    user.in_database do |user_database|
      10.times do
        user_database.run("INSERT INTO \"#{table.name}\" (Address,Latitude,Longitude) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude})")
      end
    end

    table.set_address_column!(:address)
    table.address_column.should == :address
    table.drop_column!(:name => :address)
    table.address_column.should be_nil
  end
  
  it "should set the geometry to null when removing a geometry column" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    
    lat = Float.random_latitude
    lon = Float.random_longitude
    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    
    table.set_address_column!(:address)
    pk = table.insert_row!({:address => "C/ Pilar Martí nº 16 pta 13, Burjassot, Valencia", :the_geom => the_geom})
    query_result = user.run_query("select address_geolocated from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address_geolocated].should be_true
    
    table.drop_column!(:name => :address)

    query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:lon].should be_nil
    query_result[:rows][0][:lat].should be_nil
  end
  
  it "should create a meta-column named address_geolocated which mustn't appear in the schema of the table" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    table.set_address_column!(:address)
    table.address_column.should == :address
    
    user.in_database do |user_database|
      user_database.schema(table.name.to_sym).should include(
        [:address_geolocated, {:db_type=>"boolean", :default=>nil, :allow_null=>true, :primary_key=>false, :type=>:boolean, :ruby_default=>nil}]
      )
    end
    table.schema(:cartodb_types => false).should_not include([:address_geolocated, "boolean"])
  end
  
  it "should remove the meta-column named address_geolocated when address_column is set to null" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    table.set_address_column!(:address)
    table.address_column.should == :address
    
    table.set_address_column!(nil)
    
    user.in_database do |user_database|
      user_database.schema(table.name.to_sym).should_not include(
        [:address_geolocated, {:db_type=>"boolean", :default=>nil, :allow_null=>true, :primary_key=>false, :type=>:boolean, :ruby_default=>nil}]
      )
    end
  end

  it "should remove the meta-column named address_geolocated when address_column is removed" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    table.set_address_column!(:address)
    table.address_column.should == :address
    
    table.drop_column!(:name => :address)
    
    user.in_database do |user_database|
      user_database.schema(table.name.to_sym).should_not include(
        [:address_geolocated, {:db_type=>"boolean", :default=>nil, :allow_null=>true, :primary_key=>false, :type=>:boolean, :ruby_default=>nil}]
      )
    end
  end
  
  it "should remove the meta-column named address_geolocated when latitude_column and longitude_column is set" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar, lat float, lon float"
    table.save
    table.set_address_column!(:address)
    table.address_column.should == :address
    
    table.set_lat_lon_columns!(:lat, :lon)
    
    user.in_database do |user_database|
      user_database.schema(table.name.to_sym).should_not include(
        [:address_geolocated, {:db_type=>"boolean", :default=>nil, :allow_null=>true, :primary_key=>false, :type=>:boolean, :ruby_default=>nil}]
      )
    end
  end
  
  it "should set to null all values from address_geolocated when address_column changes" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address1 varchar, address2 varchar"
    table.save

    table.set_address_column!(:address1)
    table.address_column.should == :address1

    pk = table.insert_row!({:address1 => "C/ Santa Ana", :address2 => "Santa Ana st.", :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})
    query_result = user.run_query("select address_geolocated from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address_geolocated].should be_true
    
    table.set_address_column!(:address2)
    table.address_column.should == :address2

    query_result = user.run_query("select address_geolocated from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address_geolocated].should be_nil
  end

  it "should set to null geometry columns when a latitude and longitude column is set and it is removed" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "latitude float, longitude float, address varchar"
    table.save

    user.in_database do |user_database|
      10.times do
        user_database.run("INSERT INTO \"#{table.name}\" (Address,Latitude,Longitude) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude})")
      end
    end

    table.set_lat_lon_columns!(:latitude, :longitude)
    table.lat_column.should == :latitude
    table.lon_column.should == :longitude

    table.drop_column!(:name => :latitude)
    table.lat_column.should be_nil
    table.lon_column.should be_nil
  end

  it "should set to null geometry columns when an address column is set to a type that is not string" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "latitude float, longitude float, address varchar"
    table.save

    user.in_database do |user_database|
      10.times do
        user_database.run("INSERT INTO \"#{table.name}\" (Address,Latitude,Longitude) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude})")
      end
    end

    table.set_address_column!(:address)
    table.address_column.should == :address

    table.modify_column!(:name => "address", :type => "real")
    table.address_column.should be_nil
  end

  it "should set to null geometry columns when an lat or lon column are set to a type that is not number" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "latitude float, longitude float, address varchar"
    table.save

    user.in_database do |user_database|
      10.times do
        user_database.run("INSERT INTO \"#{table.name}\" (Address,Latitude,Longitude) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude})")
      end
    end

    table.set_lat_lon_columns!(:latitude, :longitude)
    table.lat_column.should == :latitude
    table.lon_column.should == :longitude

    table.modify_column!(:name => "longitude", :type => "string")
    table.lat_column.should be_nil
    table.lon_column.should be_nil
  end

  it "should update the geometry columns when an address column is renamed" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "latitude float, longitude float, address varchar"
    table.save

    user.in_database do |user_database|
      10.times do
        user_database.run("INSERT INTO \"#{table.name}\" (Address,Latitude,Longitude) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude})")
      end
    end

    table.set_address_column!(:address)
    table.address_column.should == :address

    table.modify_column!(:old_name => "address", :new_name => "new_address")
    table.address_column.should == :new_address
  end

  it "should update the geometry columns when an lat or lon columns are renamed" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "latitude float, longitude float, address varchar"
    table.save

    user.in_database do |user_database|
      10.times do
        user_database.run("INSERT INTO \"#{table.name}\" (Address,Latitude,Longitude) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude})")
      end
    end

    table.set_lat_lon_columns!(:latitude, :longitude)
    table.lat_column.should == :latitude
    table.lon_column.should == :longitude

    table.modify_column!(:old_name => "latitude", :new_name => "new_latitude")
    table.lat_column.should == :new_latitude
    table.lon_column.should == :longitude

    table.modify_column!(:old_name => "longitude", :new_name => "new_longitude")
    table.lat_column.should == :new_latitude
    table.lon_column.should == :new_longitude
  end

  it "should return all table's constraints" do
    user = create_user
    table = create_table :user_id => user.id
    table.constraints.should have_at_least(1).item
    table.constraints.should include({:constraint_name => 'enforce_srid_the_geom'})
  end
  
  it "should set address_geolocated to true when set on the address_column and a valid the_geom" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    
    table.set_address_column!(:address)
    pk = table.insert_row!({:address => "C/ Pilar Martí nº 16 pta 13, Burjassot, Valencia", :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})
    query_result = user.run_query("select address_geolocated from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address_geolocated].should be_true    
  end
  
  it "should set address_geolocated to nil when set on the address_column and a null the_geom" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    
    table.set_address_column!(:address)
    pk = table.insert_row!({:address => "C/ Pilar Martí nº 16 pta 13, Burjassot, Valencia"})
    query_result = user.run_query("select address_geolocated from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address_geolocated].should be_nil    
  end
  
  it "should set address_geolocated to false when set on the address_column and a null the_geom" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    
    table.set_address_column!(:address)
    pk = table.insert_row!({:address => "C/ Pilar Martí nº 16 pta 13, Burjassot, Valencia", :address_geolocated => false})
    query_result = user.run_query("select address_geolocated from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address_geolocated].should be_false

    pk = table.insert_row!({:address => "C/ Santa Ana, 1, Valencia", :address_geolocated => "false"})
    query_result = user.run_query("select address_geolocated from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address_geolocated].should be_false
  end
  
  it "should update the_geom even if the address is not geolocated correctly" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    
    lat = Float.random_latitude
    lon = Float.random_longitude
    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    
    table.set_address_column!(:address)
    pk = table.insert_row!({:address => "C/ Pilar Martí nº 16 pta 13, Burjassot, Valencia", :the_geom => the_geom})
    query_result = user.run_query("select address_geolocated from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address_geolocated].should be_true
    
    table.update_row!(pk, {:address => "C/ Pilar Martínez nº 16 pta 13, Burjassot, Valencia", :address_geolocated => false})
    query_result = user.run_query("select ST_X(ST_Transform(the_geom, #{CartoDB::SRID})) as lon, ST_Y(ST_Transform(the_geom, #{CartoDB::SRID})) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:lon].should be_nil
    query_result[:rows][0][:lat].should be_nil
  end
  
  it "should ignore the attribute address_column when address_column is nil" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "latitude float, longitude float, address varchar"
    table.save

    pk = table.insert_row!({:address_column => "C/ Pilar Martí, nº16, pta 13", :latitude => Float.random_latitude, :longitude => Float.random_longitude})
    pk.should_not be_nil

    lambda {
      table.update_row!(pk, {:address_column => "C/ Pilar Martínez, nº16, pta 13", :latitude => Float.random_latitude, :longitude => Float.random_longitude})
    }.should_not raise_error
  end
  
  it "should return pending rows to be geocoded" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "address varchar"
    table.save
    
    lat = Float.random_latitude
    lon = Float.random_longitude
    the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    
    table.set_address_column!(:address)
    pk = table.insert_row!({:address => "C/ Pilar Martí nº 16 pta 13, Burjassot, Valencia", :the_geom => the_geom})
    query_result = user.run_query("select address_geolocated from #{table.name} where cartodb_id = #{pk} limit 1")
    query_result[:rows][0][:address_geolocated].should be_true

    pk2 = table.insert_row!({:address => "C/ Villa 2, Madrid"})
    table.get_records_with_pending_addresses[0][:address].should == "C/ Villa 2, Madrid"    
    table.get_records_with_pending_addresses.size.should == 1

    table.update_row!(pk2,{:the_geom => the_geom})
    table.get_records_with_pending_addresses.should be_empty
  end
  
  it "should return an empty array when there is no address column" do
    table = create_table
    table.get_records_with_pending_addresses.should be_empty
  end
end
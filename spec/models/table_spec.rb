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

  it "has a to_json method that allows to fetch rows with pagination" do
    user = create_user
    table = create_table :user_id => user.id

    table.to_json[:total_rows].should == 0
    table.to_json[:columns].should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"]]
    table.to_json[:rows].should be_empty

    10.times do
      user.run_query("INSERT INTO \"#{table.name}\" (Name,Location,Description) VALUES ('#{String.random(10)}','#{Point.from_x_y(rand(10.0), rand(10.0)).as_ewkt}','#{String.random(100)}')")
    end

    table.to_json[:total_rows].should == 10
    table.to_json[:rows].size.should == 10

    content = user.run_query("select * from \"#{table.name}\"")[:rows]

    table.to_json(:rows_per_page => 1)[:rows].size.should == 1
    table.to_json(:rows_per_page => 1)[:rows].first.should == content[0]
    table.to_json(:rows_per_page => 1)[:rows].first.should == table.to_json(:rows_per_page => 1, :page => 0)[:rows].first
    table.to_json(:rows_per_page => 1, :page => 1)[:rows].first.should == content[1]
    table.to_json(:rows_per_page => 1, :page => 2)[:rows].first.should == content[2]
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

  it "can return its schema" do
    table = create_table
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"]]
  end

  it "can modify it's schema" do
    table = create_table
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"]]

    lambda {
      table.add_column!(:name => "my column with bad status", :type => "textttt")
    }.should raise_error
    table.reload

    resp = table.add_column!(:name => "my new column", :type => "integer")
    resp.should == {:name => 'my_new_column', :type => 'integer'}
    table.reload
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"], [:my_new_column, "integer"]]

    resp = table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "text")
    resp.should == {:name => 'my_new_column_new_name', :type => 'text'}
    table.reload
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"], [:my_new_column_new_name, "text"]]

    resp = table.modify_column!(:old_name => "my_new_column_new_name", :new_name => "my new column")
    resp.should == {:name => 'my_new_column', :type => nil}
    table.reload
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"], [:my_new_column, "text"]]

    resp = table.modify_column!(:name => "my_new_column", :type => "text")
    resp.should == {:name => 'my_new_column', :type => 'text'}
    table.reload
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"], [:my_new_column, "text"]]

    table.drop_column!(:name => "location")
    table.reload
    table.schema.should == [[:id, "integer"], [:name, "text"], [:description, "text"], [:my_new_column, "text"]]

    lambda {
      table.drop_column!(:name => "location")
    }.should raise_error
    table.reload
    table.schema.should == [[:id, "integer"], [:name, "text"], [:description, "text"], [:my_new_column, "text"]]
  end

  it "should be able to modify it's schema with castings that the DB engine doesn't support" do
    table = create_table
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"]]

    table.add_column!(:name => "my new column", :type => "text")
    table.reload
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"], [:my_new_column, "text"]]

    table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "integer", :force_value => "NULL")
    table.reload
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"], [:my_new_column_new_name, "integer"]]
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

    table.update_row!(row[:id], :non_existing => 'ignore it, please', :description => "Description 123")
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

  it "has a default schema if is not imported from a file" do
    table = create_table
    table.schema.should == [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"]]
  end

  it "can be created with a given schema if it is valid" do
    table = new_table
    table.force_schema = "code char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
    table.save
    table.schema.should == [[:code, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"], [:kind, "character varying(10)"]]
  end

  it "should sanitize columns from a given schema" do
    table = new_table
    table.force_schema = "\"code wadus\" char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
    table.save
    table.schema.should == [[:code_wadus, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"], [:kind, "character varying(10)"]]
  end

  it "should import a CSV if the schema is given and is valid" do
    table = new_table
    table.force_schema = "url varchar(255) not null, login varchar(255), country varchar(255), \"followers count\" integer, foo varchar(255)"
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table.save

    table.rows_counted.should == 7
    row0 = table.to_json[:rows][0]
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

    table.rows_counted.should == 7
    table.schema.should == [[:url, "character varying"], [:login, "character varying"], [:country, "character varying"], [:followers_count, "integer"], [:unknow_name_1, "character varying"]]
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

end

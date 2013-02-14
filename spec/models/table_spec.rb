# coding: UTF-8

# NOTE that these tests are very sensitive to precisce versions of GDAL (1.9.0)
# 747 # Table post import processing tests should add a point the_geom column after importing a CSV
# 1210 # Table merging two+ tables should import and then export file twitters.csv
# 1235 # Table merging two+ tables should import and then export file SHP1.zip
# 1256 # Table merging two+ tables should import and then export file SHP1.zip as kml
# 1275 # Table merging two+ tables should import and then export file SHP1.zip as sql

require 'spec_helper'
def check_schema(table, expected_schema, options={})
  table_schema = table.schema(:cartodb_types => options[:cartodb_types] || false)
  schema_differences = (expected_schema - table_schema) + (table_schema - expected_schema)
  schema_differences.should be_empty, "difference: #{schema_differences.inspect}"
end
def create_import user, file_name, name=nil
  @data_import  = DataImport.new(:user_id => user.id)
  @data_import.save
  hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
    "database" => user.database_name,
    :logger => ::Rails.logger,
    "username" => user.database_username,
    "password" => user.database_password,
    :import_from_file => file_name,
    :debug => (Rails.env.development?),
    :data_import_id => @data_import.id,
    :remaining_quota => user.remaining_quota
  ).symbolize_keys
  importer = CartoDB::Importer.new hash_in
  return importer.import!
end

describe Table do

  before(:all) do
    puts "\n[rspec][table_spec] Creating test user database..."
    @quota_in_bytes = 524288000
    @table_quota    = 500
    @new_user = new_user
    @user     = create_user(:quota_in_bytes => @quota_in_bytes, :table_quota => @table_quota)
    puts "[rspec][table_spec] Running..."
  end

  context "table setups" do
    it "should set a default name different than the previous" do
      table = Table.new
      table.user_id = @user.id
      table.save.reload
      table.name.should == "untitled_table"

      table2 = Table.new
      table2.user_id = @user.id
      table2.save.reload
      table2.name.should == "untitled_table_2"
    end

    it "should create default associated map and layers" do
      table = create_table({:name => "epaminondas__pantulis", :user_id => @user.id})

      table.map.should be_an_instance_of(Map)
      table.map.values.slice(:zoom, :bounding_box_sw, :bounding_box_ne, :provider).should == { zoom: 3, bounding_box_sw: "[0, 0]", bounding_box_ne: "[0, 0]", provider: 'leaflet'}
      table.map.layers.count.should == 2
      table.map.layers.map(&:kind).should == ['tiled', 'carto']
      table.map.data_layers.first.infowindow["fields"].should == [{"name"=>"cartodb_id", "title"=>true, "position"=>1}, {"name"=>"description", "title"=>true, "position"=>2}, {"name"=>"name", "title"=>true, "position"=>3}]
      table.map.data_layers.first.options["table_name"].should == "epaminondas__pantulis"
    end

    it "should return a sequel interface" do
      table = create_table :user_id => @user.id
      table.sequel.class.should == Sequel::Postgres::Dataset
    end

    it "should have a privacy associated and it should be private by default" do
      table = create_table :user_id => @user.id
      table.should be_private
      $tables_metadata.hget(table.key,"privacy").to_i.should == Table::PRIVATE
    end

    it "should be public if the creating user doesn't have the ability to make private tables" do
      @user.private_tables_enabled = false
      @user.save
      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PUBLIC
    end

    it "should be private if it's creating user has the ability to make private tables" do
      @user.private_tables_enabled = true
      @user.save
      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PRIVATE
    end

    it "should be able to make private tables if the user gets the ability to do it" do
      @user.private_tables_enabled = false
      @user.save

      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PUBLIC

      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PRIVATE
    end

    it "should only be able to make public tables if the user is stripped of permissions" do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PRIVATE

      @user.private_tables_enabled = false
      @user.save

      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PUBLIC
    end

    it "should still be able to edit the private table if the user is stripped of permissions" do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PRIVATE

      @user.private_tables_enabled = false
      @user.save

      table.name = "my_super_test"
      table.save.should be_true
    end

    it "should be able to convert to public table if the user is stripped of permissions" do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PRIVATE

      @user.private_tables_enabled = false
      @user.save

      table.privacy = Table::PUBLIC
      table.save.should be_true
    end

    it "should not be able to convert to public table if the user has no permissions" do
      @user.private_tables_enabled = false
      @user.save

      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PUBLIC

      table.privacy = Table::PRIVATE
      expect {
        table.save
      }.to raise_error(Sequel::ValidationFailed)
    end

    it "should not be able to convert to public table if the user is stripped of " do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.privacy.should == Table::PRIVATE

      @user.private_tables_enabled = false
      @user.save

      table.privacy = Table::PUBLIC
      table.save
      table.owner.reload # this is because the ORM is stupid

      table.privacy = Table::PRIVATE
      expect {
        table.save
      }.to raise_error(Sequel::ValidationFailed)
    end

    it "should not allow public user access to a table when it is private" do
      @user.private_tables_enabled = true
      @user.save

      table = create_table(:user_id => @user.id)
      table.should be_private

      expect {
        @user.in_database(:as => :public_user).run("select * from #{table.name}")
      }.to raise_error(Sequel::DatabaseError)
    end

    it "should allow public user access when the table is public" do
      @user.private_tables_enabled = true
      @user.save
      table = create_table(:user_id => @user.id)

      table.should be_private
      $tables_metadata.hget(table.key,"privacy").to_i.should == Table::PRIVATE

      table.privacy = Table::PUBLIC
      table.save

      expect {
        @user.in_database(:as => :public_user).run("select * from #{table.name}")
      }.to_not raise_error

      $tables_metadata.hget(table.key,"privacy").to_i.should == Table::PUBLIC
    end

    it "should be associated to a database table" do
      @user.private_tables_enabled = false
      @user.save
      table = create_table({:name => 'Wadus table', :user_id => @user.id})

      Rails::Sequel.connection.table_exists?(table.name.to_sym).should be_false

      @user.in_database do |user_database|
        user_database.table_exists?(table.name.to_sym).should be_true
      end
    end

    it "should store the name of its database" do
      @user.private_tables_enabled = false
      @user.save
      table = create_table(:user_id => @user.id)

      table.database_name.should == @user.database_name
    end

    it "should rename a database table when the attribute name is modified" do
      delete_user_data @user
      @user.private_tables_enabled = false
      @user.save

      table = create_table({:name => 'Wadus table', :user_id => @user.id})

      Rails::Sequel.connection.table_exists?(table.name.to_sym).should be_false
      @user.in_database do |user_database|
        user_database.table_exists?(table.name.to_sym).should be_true
      end

      table.name = 'Wadus table #23'
      table.save
      table.reload
      table.name.should == "Wadus table #23".sanitize
      @user.in_database do |user_database|
        user_database.table_exists?('wadus_table'.to_sym).should be_false
        user_database.table_exists?('wadus_table_23'.to_sym).should be_true
      end

      table.name = ''
      table.save
      table.reload
      table.name.should == "Wadus table #23".sanitize
      @user.in_database do |user_database|
        user_database.table_exists?('wadus_table_23'.to_sym).should be_true
      end
    end

    it "should remove varnish cache when the table is renamed" do
      delete_user_data @user
      @user.private_tables_enabled = false
      @user.save

      table = create_table({:name => 'Wadus table', :user_id => @user.id})

      CartoDB::Varnish.any_instance.expects(:purge).with("obj.http.X-Cache-Channel ~ #{table.owner.database_name}:wadus_table_23:vizjson").returns(true)
      CartoDB::Varnish.any_instance.expects(:purge).with("obj.http.X-Cache-Channel ~ #{table.owner.database_name}:wadus_table_23.*").returns(true)
      CartoDB::Varnish.any_instance.expects(:purge).with("obj.http.X-Cache-Channel ~ #{table.owner.database_name}:wadus_table.*").returns(true)
      table.name = 'Wadus table #23'
      table.save
    end

    it "should store the identifier of its owner when created" do
      table = create_table(:user_id => @user.id)
      $tables_metadata.hget(table.key,"user_id").should == table.user_id.to_s
    end

    it "should rename the pk sequence when renaming the table" do
      table1 = new_table :name => 'table 1', :user_id => @user.id
      table1.save.reload
      table1.name.should == 'table_1'

      table1.name = 'table 2'
      table1.save.reload
      table1.name.should == 'table_2'

      table2 = new_table :name => 'table 1', :user_id => @user.id
      table2.save.reload
      table2.name.should == 'table_1'

      lambda {
        table2.destroy
      }.should_not raise_error
    end

    it "can create a table called using a reserved postgresql word as its name" do
      delete_user_data @user
      @user.private_tables_enabled = false
      @user.save

      table = create_table({:name => 'as', :user_id => @user.id})

      @user.in_database do |user_database|
        user_database.table_exists?(table.name.to_sym).should be_true
      end

      table.name = 'where'
      table.save
      table.reload
      @user.in_database do |user_database|
        user_database.table_exists?('where'.to_sym).should be_true
      end
    end

  end

  context "redis syncs" do
    it "should have a unique key to be identified in Redis" do
      table = create_table(:user_id => @user.id)
      table.key.should == "rails:#{table.database_name}:#{table.name}"
    end

    it "should rename the entries in Redis when the table has been renamed" do
      table = create_table(:user_id => @user.id)
      original_name = table.name
      original_the_geom_type = table.the_geom_type

      table.name = "brand_new_name"
      table.save_changes
      table.reload

      table.key.should == "rails:#{table.database_name}:#{table.name}"
      $tables_metadata.exists(table.key).should be_true
      $tables_metadata.exists(original_name).should be_false
      $tables_metadata.hget(table.key, "privacy").should be_present
      $tables_metadata.hget(table.key, "user_id").should be_present
      $tables_metadata.hget(table.key,"the_geom_type").should == original_the_geom_type
    end

    it "should store the_geom_type in Redis" do
      table = create_table(:user_id => @user.id)

      table.the_geom_type.should == "geometry"
      $tables_metadata.hget(table.key,"the_geom_type").should == "geometry"

      table.the_geom_type = "multipolygon"
      $tables_metadata.hget(table.key,"the_geom_type").should == "multipolygon"
    end

    it "should remove the table from Redis when removing the table" do
      table = create_table(:user_id => @user.id)
      $tables_metadata.exists(table.key).should be_true
      table.destroy
      $tables_metadata.exists(table.key).should be_false
    end

    it "should remove varnish cache when removing the table" do
      table = create_table(:user_id => @user.id)
      CartoDB::Varnish.any_instance.expects(:purge).with("obj.http.X-Cache-Channel ~ #{table.varnish_key}.*").returns(true)

      table.destroy
    end

    it "should remove varnish cache when updating the table" do
      table = create_table(:user_id => @user.id)
      CartoDB::Varnish.any_instance.expects(:purge).times(1).with("obj.http.X-Cache-Channel ~ #{table.varnish_key}:vizjson").returns(true)
      CartoDB::Varnish.any_instance.expects(:purge).times(1).with("obj.http.X-Cache-Channel ~ #{table.varnish_key}.*").returns(true)
      table.save
    end
  end

  context "schema and columns" do
    it "has a default schema" do
      table = create_table(:user_id => @user.id)
      table.reload
      table.schema(:cartodb_types => false).should be_equal_to_default_db_schema
      table.schema.should be_equal_to_default_cartodb_schema
    end

    it "can be associated to many tags" do
      delete_user_data @user
      table = create_table :user_id => @user.id, :tags => "tag 1, tag 2,tag 3, tag 3"

      Tag.count.should == 3

      tag1 = Tag[:name => 'tag 1']
      tag1.user_id.should  == @user.id
      tag1.table_id.should == table.id

      tag2 = Tag[:name => 'tag 2']
      tag2.user_id.should  == @user.id
      tag2.table_id.should == table.id

      tag3 = Tag[:name => 'tag 3']
      tag3.user_id.should  == @user.id
      tag3.table_id.should == table.id

      table.tags = "tag 1"
      table.save_changes

      Tag.count.should == 1
      tag1 = Tag[:name => 'tag 1']
      tag1.user_id.should  == @user.id
      tag1.table_id.should == table.id

      table.tags = "    "
      table.save_changes
      Tag.count.should == 0
    end

    it "can add a column of a CartoDB::TYPE type" do
      table = create_table(:user_id => @user.id)
      table.schema(:cartodb_types => false).should be_equal_to_default_db_schema

      resp = table.add_column!(:name => "my new column", :type => "number")
      resp.should == {:name => "my_new_column", :type => "double precision", :cartodb_type => "number"}
      table.reload
      table.schema(:cartodb_types => false).should include([:my_new_column, "double precision"])
    end

    it "can modify a column using a CartoDB::TYPE type" do
      table = create_table(:user_id => @user.id)

      resp = table.modify_column!(:name => "name", :type => "number")
      resp.should == {:name => "name", :type => "double precision", :cartodb_type => "number"}
    end

    it "should not modify the name of a column to a number" do
      table = create_table(:user_id => @user.id)
      lambda {
        table.modify_column!(:old_name => "name", :new_name => "1")
      }.should raise_error(CartoDB::InvalidColumnName)
    end

    it "can modify it's schema" do
      table = create_table(:user_id => @user.id)
      table.schema(:cartodb_types => false).should be_equal_to_default_db_schema

      lambda {
        table.add_column!(:name => "my column with bad type", :type => "textttt")
      }.should raise_error(CartoDB::InvalidType)

      resp = table.add_column!(:name => "my new column", :type => "integer")
      resp.should == {:name => 'my_new_column', :type => 'integer', :cartodb_type => 'number'}
      table.reload
      table.schema(:cartodb_types => false).should include([:my_new_column, "integer"])

      resp = table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "text")
      resp.should == {:name => 'my_new_column_new_name', :type => 'text', :cartodb_type => 'string'}
      table.reload
      table.schema(:cartodb_types => false).should include([:my_new_column_new_name, "text"])

      resp = table.modify_column!(:old_name => "my_new_column_new_name", :new_name => "my new column")
      resp.should == {:name => 'my_new_column', :type => "text", :cartodb_type => "string"}
      table.reload
      table.schema(:cartodb_types => false).should include([:my_new_column, "text"])

      resp = table.modify_column!(:name => "my_new_column", :type => "text")
      resp.should == {:name => 'my_new_column', :type => 'text', :cartodb_type => 'string'}
      table.reload
      table.schema(:cartodb_types => false).should include([:my_new_column, "text"])

      table.drop_column!(:name => "description")
      table.reload
      table.schema(:cartodb_types => false).should_not include([:description, "text"])

      lambda {
        table.drop_column!(:name => "description")
      }.should raise_error
    end

    it "cannot modify :cartodb_id column" do
      table = create_table(:user_id => @user.id)
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
      table = create_table(:user_id => @user.id)
      table.add_column!(:name => "my new column", :type => "text")
      table.reload
      table.schema(:cartodb_types => false).should include([:my_new_column, "text"])

      pk = table.insert_row!(:name => "Text", :my_new_column => "1")
      table.modify_column!(:old_name => "my_new_column", :new_name => "my new column new name", :type => "integer", :force_value => "NULL")
      table.reload
      table.schema(:cartodb_types => false).should include([:my_new_column_new_name, "integer"])

      rows = table.records
      rows[:rows][0][:my_new_column_new_name].should == 1
    end

    it "can be created with a given schema if it is valid" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "code char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
      table.save
      check_schema(table, [
        [:updated_at, "timestamp without time zone"], [:created_at, "timestamp without time zone"], [:cartodb_id, "integer"],
        [:code, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"],
        [:kind, "character varying(10)"]
      ])
    end

    it "should sanitize columns from a given schema" do
      delete_user_data @user
      table = new_table(:user_id => @user.id)
      table.force_schema = "\"code wadus\" char(5) CONSTRAINT firstkey PRIMARY KEY, title  varchar(40) NOT NULL, did  integer NOT NULL, date_prod date, kind varchar(10)"
      table.save
      check_schema(table, [
        [:updated_at, "timestamp without time zone"], [:created_at, "timestamp without time zone"], [:cartodb_id, "integer"],
        [:code_wadus, "character(5)"], [:title, "character varying(40)"], [:did, "integer"], [:date_prod, "date"],
        [:kind, "character varying(10)"]
      ])
    end

    it "should alter the schema automatically to a a wide range of numbers when inserting" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "name varchar, age integer"
      table.save

      pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
      table.rows_counted.should == 1

      pk_row2 = table.insert_row!(:name => 'Javi Jam', :age => "25.4")
      table.rows_counted.should == 2

      table.schema(:cartodb_types => false).should include([:age, "double precision"])
      table.schema.should include([:age, "number"])
    end

    it "should alter the schema automatically to a a wide range of numbers when inserting a number with 0" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "name varchar, age integer"
      table.save

      pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
      table.rows_counted.should == 1

      pk_row2 = table.insert_row!(:name => 'Javi Jam', :age => "25.0")
      table.rows_counted.should == 2

      table.schema(:cartodb_types => false).should include([:age, "double precision"])
      table.schema.should include([:age, "number"])
    end

    it "should alter the schema automatically to a a wide range of numbers when updating" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "name varchar, age integer"
      table.save

      pk_row1 = table.insert_row!(:name => 'Fernando Blat', :age => "29")
      table.rows_counted.should == 1

      pk_row2 = table.update_row!(pk_row1, :name => 'Javi Jam', :age => "25.4")
      table.rows_counted.should == 1

      table.schema(:cartodb_types => false).should include([:age, "double precision"])
      table.schema.should include([:age, "number"])
    end

    it "should alter the schema automatically when trying to insert a big string (greater than 200 chars)" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "name varchar(40)"
      table.save

      table.schema(:cartodb_types => false).should_not include([:name, "text"])

      pk_row1 = table.insert_row!(:name => 'f'*201)
      table.rows_counted.should == 1

      table.reload
      table.schema(:cartodb_types => false).should include([:name, "text"])
    end

    it "should not remove an existing table when the creation of a new table with default schema and the same name has raised an exception" do
      table = new_table({:name => 'table1', :user_id => @user.id})
      table.save
      pk = table.insert_row!({:name => "name #1", :description => "description #1"})

      Table.any_instance.stubs(:the_geom_type=).raises(CartoDB::InvalidGeomType)

      table = new_table({:name => 'table1', :user_id => @user.id})
      lambda {
        table.save
      }.should raise_error(CartoDB::InvalidGeomType)

      table.run_query("select name from table1 where cartodb_id = '#{pk}'")[:rows].first[:name].should == "name #1"
    end

    it "should not remove an existing table when the creation of a new table from a file with the same name has raised an exception" do
      table = new_table({:name => 'table1', :user_id => @user.id})
      table.save

      pk = table.insert_row!({:name => "name #1", :description => "description #1"})

      Table.any_instance.stubs(:schema).raises(CartoDB::QueryNotAllowed)

      data_import = DataImport.create( :user_id       => @user.id,
                                    :table_name    => 'rescol',
                                    :data_source   => '/../db/fake_data/reserved_columns.csv' )

      table.run_query("select name from table1 where cartodb_id = '#{pk}'")[:rows].first[:name].should == "name #1"
    end

    it "can add a column called 'action'" do
      table = create_table(:user_id => @user.id)

      resp = table.add_column!(:name => "action", :type => "number")
      resp.should == {:name => "action", :type => "double precision", :cartodb_type => "number"}
      table.reload
      table.schema(:cartodb_types => false).should include([:action, "double precision"])
    end

    it "can have a column with a reserved psql word as its name" do
      table = create_table(:user_id => @user.id)

      resp = table.add_column!(:name => "where", :type => "number")
      resp.should == {:name => "where", :type => "double precision", :cartodb_type => "number"}
      table.reload
      table.schema(:cartodb_types => false).should include([:where, "double precision"])
    end

    it "properly empties blank columns when changing its data type from String to Date" do
      table = create_table(:user_id => @user.id)
      resp = table.add_column!(:name => "wadus", :type => "string")

      pk = table.insert_row!(:wadus => "")
      pk = table.insert_row!(:wadus => "")
      pk = table.insert_row!(:wadus => "")
      pk = table.insert_row!(:wadus => "")
      pk = table.insert_row!(:wadus => "")

      expect{table.modify_column!(:name => "wadus", :type => "date")}.to_not raise_error(Sequel::DatabaseError)

      table.records[:rows][0][:wadus].should be_nil
      table.records[:rows][1][:wadus].should be_nil
      table.records[:rows][2][:wadus].should be_nil
      table.records[:rows][3][:wadus].should be_nil
      table.records[:rows][4][:wadus].should be_nil
    end

  end

  context "insert and update rows" do
    it "should be able to insert a row with correct created_at and updated_at values" do
      table = create_table(:user_id => @user.id)
      pk1 = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
      sleep(0.2)
      pk2 = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
      first_created_at  = table.records[:rows].first[:created_at]
      second_created_at = table.records[:rows].last[:created_at]
      first_updated_at  = table.records[:rows].first[:updated_at]
      second_updated_at = table.records[:rows].last[:updated_at]

      first_created_at.should  == first_updated_at
      second_created_at.should == second_updated_at

      first_created_at.should_not == second_created_at
      first_updated_at.should_not == second_updated_at

      table.update_row!(pk1, :description => "Description 123")
      first_updated_at_2 = table.records[:rows].first[:updated_at]
      first_updated_at_2.should_not == table.records[:rows].first[:created_at]
      first_updated_at_2.should_not == first_updated_at
    end

    it "should be able to insert a new row" do
      table = create_table(:user_id => @user.id)
      table.rows_counted.should == 0
      primary_key = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
      table.reload
      table.rows_counted.should == 1
      primary_key.should == table.records(:rows_per_page => 1)[:rows].first[:cartodb_id]

      lambda {
        table.insert_row!({})
      }.should_not raise_error(CartoDB::EmptyAttributes)

      lambda {
        table.insert_row!({:non_existing => "bad value"})
      }.should raise_error(CartoDB::InvalidAttributes)
    end

    it "should be able to insert a row with a geometry value" do
      table = new_table(:user_id => @user.id)
      table.save.reload

      lat = -43.941
      lon = 3.429
      the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
      pk = table.insert_row!({:name => "First check_in", :the_geom => the_geom})

      query_result = @user.run_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
      ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
      ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
    end

    it "should update null value to nil when inserting and updating" do
      table = new_table(:user_id => @user.id)
      table.force_schema = "valid boolean"
      table.save.reload

      pk = table.insert_row!({:valid => "null"})
      table.record(pk)[:valid].should be_nil

      pk = table.insert_row!({:valid => true})
      table.update_row!(pk, {:valid => "null"})
      table.record(pk)[:valid].should be_nil
    end

    it "should be able to update a row" do
      table = create_table(:user_id => @user.id)

      pk = table.insert_row!({:name => String.random(10), :description => ""})
      table.update_row!(pk, :description => "Description 123")

      row = table.records(:rows_per_page => 1, :page => 0)[:rows].first
      row[:description].should == "Description 123"

      lambda {
        table.update_row!(pk, :non_existing => 'ignore it, please', :description => "Description 123")
      }.should raise_error(CartoDB::InvalidAttributes)
    end

    it "should be able to update a row with a geometry value" do
      table = new_table(:user_id => @user.id)
      table.save.reload

      lat = -43.941
      lon = 3.429
      pk = table.insert_row!({:name => "First check_in"})

      the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
      table.update_row!(pk, {:the_geom => the_geom})

      query_result = @user.run_query("select ST_X(the_geom) as lon, ST_Y(the_geom) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
      ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
      ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
    end

    it "should be able to update data in rows with column names with multiple underscores" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :table_name    => 'elecciones2008',
                                       :data_source   => '/../spec/support/data/elecciones2008.csv')

      table = Table[data_import.table_id]
      update_data = {:upo___nombre_partido=>"PSOEE"}
      id = 5

      lambda {
        table.update_row!(id, update_data)
      }.should_not raise_error

      res = table.sequel.where(:cartodb_id => 5).first
      res[:upo___nombre_partido].should == "PSOEE"
    end

    it "should be able to insert data in rows with column names with multiple underscores" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../spec/support/data/elecciones2008.csv')

      table = Table[data_import.table_id]
      pk = nil
      insert_data = {:upo___nombre_partido=>"PSOEE"}

      lambda {
        pk = table.insert_row!(insert_data)
      }.should_not raise_error

      res = table.sequel.where(:cartodb_id => pk).first
      res[:upo___nombre_partido].should == "PSOEE"
    end

    it "can insert and update records in a table with a reserved word as its name" do
      table = create_table(:name => 'where', :user_id => @user.id)
      pk1 = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})
      pk2 = table.insert_row!({:name => String.random(10), :description => "bla bla bla"})

      table.records[:rows].should have(2).rows

      table.update_row!(pk1, :description => "Description 123")
      table.records[:rows].first[:description].should be == "Description 123"
    end

    it "can insert and update records in a table which one of its columns uses a reserved word as its name" do
      table = create_table(:name => 'where', :user_id => @user.id)
      table.add_column!(:name => 'where', :type => 'string')

      pk1 = table.insert_row!({:where => 'random string'})

      table.records[:rows].should have(1).rows
      table.records[:rows].first[:where].should be == 'random string'
    end
  end

  context "counter updates" do
    it "should increase the tables_count counter from owner" do
      delete_user_data(@user) && @user.reload
      @user.tables_count.should == 0

      table = create_table(:user_id => @user.id)
      @user.reload
      @user.tables_count.should == 1
    end

    it "should remove and updating the denormalized counters when removed" do
      delete_user_data(@user) && @user.reload
      table = create_table :user_id => @user.id, :tags => 'tag 1, tag2'

      table.destroy
      @user.reload
      @user.tables_count.should == 0
      Tag.count.should == 0
      Table.count == 0
      @user.in_database{|database| database.table_exists?(table.name).should be_false}
    end

  end
  context "preimport tests" do
    it "rename a table to a name that exists should add a _2 to the new name" do
      table = new_table :name => 'empty_file', :user_id => @user.id
      table.save.reload
      table.name.should == 'empty_file'

      table2 = new_table :name => 'empty_file', :user_id => @user.id
      table2.save.reload
      table2.name.should == 'empty_file_2'
    end

    it "should escape table names starting with numbers" do
      table = new_table :user_id => @user.id, :name => '123_table_name'
      table.save.reload

      table.name.should == "table_123_table_name"

      table = new_table :user_id => @user.id, :name => '_table_name'
      table.save.reload

      table.name.should == "table_table_name"
    end

    it "should get a valid name when a table when a name containing the current name exists" do
      table = create_table :name => 'Table #20', :user_id => @user.id
      table2 = create_table :name => 'Table #2', :user_id => @user.id
      table2.reload
      table2.name.should == 'table_2'

      table3 = create_table :name => nil, :user_id => @user.id
      table4 = create_table :name => nil, :user_id => @user.id
      table5 = create_table :name => nil, :user_id => @user.id
      table6 = create_table :name => nil, :user_id => @user.id
    end

    it "should allow creating multiple tables with the same name by adding a number at the and and incrementing it" do
      table = create_table :name => 'Wadus The Table', :user_id => @user.id
      table.name.should == "wadus_the_table"

      # Renaming starts at 2
      2.upto(25) do |n|
        table = create_table :name => 'Wadus The Table', :user_id => @user.id
        table.name.should == "wadus_the_table_#{n}"
      end
    end
  end

  context "post import processing tests" do

    it "should run vacuum full" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/SHP1.zip' )
      table = Table[data_import.table_id]
      table.table_size.should == 2351104
    end

    it "should add a point the_geom column after importing a CSV" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/twitters.csv' )

      table = Table[data_import.table_id]
      table.name.should match(/^twitters/)
      table.rows_counted.should == 7
      check_schema(table, [
        [:cartodb_id, "integer"], [:url, "text"], [:login, "text"],
        [:country, "text"], [:followers_count, "text"],
        [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"], [:the_geom, "geometry", "geometry", "geometry"],
        [:field_5, "text"]
      ])

      row = table.records[:rows][0]
      row[:url].should == "http://twitter.com/vzlaturistica/statuses/23424668752936961"
      row[:login].should == "vzlaturistica "
      row[:country].should == " Venezuela "
      row[:followers_count].should == "211"
    end

    it "should not drop a table that exists when upload fails" do
      delete_user_data @user
      table = new_table :name => 'empty_file', :user_id => @user.id
      table.save.reload
      table.name.should == 'empty_file'

      importer, errors = create_import @user, "#{Rails.root}/db/fake_data/empty_file.csv"

      @user.in_database do |user_database|
        user_database.table_exists?(table.name.to_sym).should be_true
      end
    end

    it "should not drop a table that exists when upload does not fail" do
      delete_user_data @user
      table = new_table :name => 'empty_file', :user_id => @user.id
      table.save.reload
      table.name.should == 'empty_file'

      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/csv_no_quotes.csv' )

      table2 = Table[data_import.table_id]
      table2.name.should == 'csv_no_quotes'

      @user.in_database do |user_database|
        user_database.table_exists?(table.name.to_sym).should be_true
        user_database.table_exists?(table2.name.to_sym).should be_true
      end
    end

    it "should remove the user_table even when phisical table does not exist" do
      delete_user_data @user
      table = new_table :name => 'empty_file', :user_id => @user.id
      table.save.reload
      table.name.should == 'empty_file'

      @user.in_database do |user_database|
        user_database.drop_table(table.name.to_sym)
      end

      table.destroy
      Table[table.id].should be_nil
    end

    it "should raise an error when creating a column with reserved name" do
      table = create_table(:user_id => @user.id)
      lambda {
        table.add_column!(:name => "xmin", :type => "number")
      }.should raise_error(CartoDB::InvalidColumnName)
    end

    it "should raise an error when renaming a column with reserved name" do
      table = create_table(:user_id => @user.id)
      lambda {
        table.modify_column!(:old_name => "name", :new_name => "xmin")
      }.should raise_error(CartoDB::InvalidColumnName)
    end

    it "should add a cartodb_id serial column as primary key when importing a file without a column with name cartodb_id" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/gadm4_export.csv' )

      table = Table[data_import.table_id]
      table_schema = @user.in_database.schema(table.name)

      cartodb_id_schema = table_schema.detect {|s| s[0].to_s == "cartodb_id"}
      cartodb_id_schema.should be_present
      cartodb_id_schema = cartodb_id_schema[1]
      cartodb_id_schema[:db_type].should == "integer"
      cartodb_id_schema[:default].should == "nextval('#{table.name}_cartodb_id_seq1'::regclass)"
      cartodb_id_schema[:primary_key].should == true
      cartodb_id_schema[:allow_null].should == false
    end

    it "should add an invalid_cartodb_id column when importing a file with invalid data on the cartodb_id column" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   =>  '/../db/fake_data/duplicated_cartodb_id.zip')
      table = Table[data_import.table_id]

      table_schema = @user.in_database.schema(table.name)

      cartodb_id_schema = table_schema.detect {|s| s[0].to_s == "cartodb_id"}
      cartodb_id_schema.should be_present
      cartodb_id_schema = cartodb_id_schema[1]
      cartodb_id_schema[:db_type].should == "integer"
      cartodb_id_schema[:default].should == "nextval('#{table.name}_cartodb_id_seq'::regclass)"
      cartodb_id_schema[:primary_key].should == true
      cartodb_id_schema[:allow_null].should == false
      invalid_cartodb_id_schema = table_schema.detect {|s| s[0].to_s == "invalid_cartodb_id"}
      invalid_cartodb_id_schema.should be_present
    end

    it "should return geometry types" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/gadm4_export.csv' )

      table = Table[data_import.table_id]

      table.geometry_types.should == ['ST_Point']
    end

    # FIXME: Don't know if we still support this behaviour, or if it's something from the past
    pending "should copy cartodb_id values to a new cartodb_id serial column when importing a file which already has a cartodb_id column" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/with_cartodb_id.csv' )
      table = Table[data_import.table_id]

      check_schema(table, [
        [:cartodb_id, "number"], [:name, "string"], [:the_geom, "geometry", "geometry", "point"],
        [:invalid_the_geom, "string"], [:created_at, "date"], [:updated_at, "date"]
      ], :cartodb_types => true)

      table_schema = @user.in_database.schema(table.name)
      cartodb_id_schema = table_schema.detect {|s| s[0].to_s == "cartodb_id"}
      cartodb_id_schema.should be_present
      cartodb_id_schema = cartodb_id_schema[1]
      cartodb_id_schema[:db_type].should == "integer"
      cartodb_id_schema[:default].should == "nextval('#{table.name}_cartodb_id_seq'::regclass)"
      cartodb_id_schema[:primary_key].should == true
      cartodb_id_schema[:allow_null].should == false

      # CSV has this data:
      # 3,Row 3,2011-08-29 16:18:37.114106,2011-08-29 16:19:07.61527,
      # 5,Row 5,2011-08-29 16:18:37.114106,2011-08-29 16:19:16.216058,
      # 7,Row 7,2011-08-29 16:18:37.114106,2011-08-29 16:19:31.380103,

      # cartodb_id values should be preserved
      rows = table.records(:order_by => "cartodb_id", :mode => "asc")[:rows]
      rows.size.should == 3
      rows[0][:cartodb_id].should == 3
      rows[0][:name].should == "Row 3"
      rows[1][:cartodb_id].should == 5
      rows[1][:name].should == "Row 5"
      rows[2][:cartodb_id].should == 7
      rows[2][:name].should == "Row 7"

      table.insert_row!(:name => "Row 8")
      rows = table.records(:order_by => "cartodb_id", :mode => "asc")[:rows]
      rows.size.should == 4
      rows.last[:cartodb_id].should == 8
      rows.last[:name].should == "Row 8"
    end

    it "should make sure it converts created_at and updated at to date types when importing from CSV" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/gadm4_export.csv' )
      table = Table[data_import.table_id]

      schema = table.schema(:cartodb_types => true)
      schema.include?([:updated_at, "date"]).should == true
      schema.include?([:created_at, "date"]).should == true
    end

    it "should normalize strings if there is a non-convertible entry when converting string to number" do
      table = new_table :user_id => @user.id
      table.name = "clubbing"
      importer, errors = create_import @user, "#{Rails.root}/db/fake_data/short_clubbing.csv"

      table.migrate_existing_table = importer[0].name
      table.save.reload

      table.modify_column! :name=> "club_id", :type=>"number", :old_name=>"club_id", :new_name=>nil

      table.sequel.where(:cartodb_id => '1').first[:club_id].should == 709
      table.sequel.where(:cartodb_id => '2').first[:club_id].should == 892
      table.sequel.where(:cartodb_id => '3').first[:club_id].should == 992
      table.sequel.where(:cartodb_id => '4').first[:club_id].should == nil
      table.sequel.where(:cartodb_id => '5').first[:club_id].should == 941
    end

    it "should normalize string if there is a non-convertible entry when converting string to boolean" do
      table = new_table :user_id => @user.id
      table.name = "my_precious"
      importer, errors = create_import @user, "#{Rails.root}/db/fake_data/column_string_to_boolean.csv"

      table.migrate_existing_table = importer[0].name
      table.save.reload

      # configure nil column
      table.sequel.where(:test_id => '4').update(:f1 => '0')

      # configure nil column
      table.sequel.where(:test_id => '11').update(:f1 => nil)

      # configure blank column
      table.sequel.insert(:test_id => '12', :f1 => "")

      # update datatype
      table.modify_column! :name=>"f1", :type=>"boolean", :old_name=>"f1", :new_name=>nil

      # test
      table.sequel.where(:cartodb_id => '1').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '2').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '3').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '4').first[:f1].should == false
      table.sequel.select(:f1).where(:cartodb_id => '5').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '6').first[:f1].should == true
      table.sequel.select(:f1).where(:cartodb_id => '7').first[:f1].should == true
      table.sequel.select(:f1).where(:test_id => '8').first[:f1].should == false
      table.sequel.select(:f1).where(:test_id => '9').first[:f1].should == false
      table.sequel.select(:f1).where(:test_id => '10').first[:f1].should == false
      table.sequel.select(:f1).where(:test_id => '11').first[:f1].should == nil
      table.sequel.select(:f1).where(:test_id => '12').first[:f1].should == nil
    end

    it "should normalize boolean if there is a non-convertible entry when converting boolean to string" do
      table = new_table :user_id => @user.id
      table.name = "my_precious"
      importer, errors = create_import @user, "#{Rails.root}/db/fake_data/column_string_to_boolean.csv"

      table.migrate_existing_table = importer[0].name
      table.save.reload

      table.modify_column! :name=>"f1", :type=>"boolean", :old_name=>"f1", :new_name=>nil
      table.modify_column! :name=>"f1", :type=>"string", :old_name=>"f1", :new_name=>nil

      table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == 'true'
      table.sequel.select(:f1).where(:test_id => '8').first[:f1].should == 'false'
    end

    it "should normalize boolean if there is a non-convertible entry when converting boolean to number" do
      table = new_table :user_id => @user.id
      table.name = "my_precious"
      importer, errors = create_import @user, "#{Rails.root}/db/fake_data/column_string_to_boolean.csv"

      table.migrate_existing_table = importer[0].name
      table.save.reload

      table.modify_column! :name=>"f1", :type=>"boolean", :old_name=>"f1", :new_name=>nil
      table.modify_column! :name=>"f1", :type=>"number", :old_name=>"f1", :new_name=>nil

      table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == 1
      table.sequel.select(:f1).where(:test_id => '8').first[:f1].should == 0
    end

    it "should normalize number if there is a non-convertible entry when converting number to boolean" do
      table = new_table :user_id => @user.id
      table.name = "my_precious"
      importer, errors = create_import @user, "#{Rails.root}/db/fake_data/column_number_to_boolean.csv"

      table.migrate_existing_table = importer[0].name
      table.save.reload

      table.modify_column! :name=>"f1", :type=>"number", :old_name=>"f1", :new_name=>nil
      table.modify_column! :name=>"f1", :type=>"boolean", :old_name=>"f1", :new_name=>nil

      table.sequel.select(:f1).where(:test_id => '1').first[:f1].should == true
      table.sequel.select(:f1).where(:test_id => '2').first[:f1].should == false
      table.sequel.select(:f1).where(:test_id => '3').first[:f1].should == true
      table.sequel.select(:f1).where(:test_id => '4').first[:f1].should == true
    end
  end

  context "geoms and projections" do
    it "should set valid geometry types" do
      table = new_table :user_id => @user.id
      table.force_schema = "address varchar, the_geom geometry"
      table.the_geom_type = "line"
      table.save
      table.reload
      table.the_geom_type.should == "multilinestring"
    end

    it "should create a the_geom_webmercator column with the_geom projected to 3785" do
      table = new_table :user_id => @user.id
      table.save.reload

      lat = -43.941
      lon = 3.429
      pk = table.insert_row!({:name => "First check_in"})

      the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
      table.update_row!(pk, {:the_geom => the_geom})

      query_result = @user.run_query("select ST_X(ST_TRANSFORM(the_geom_webmercator,4326)) as lon, ST_Y(ST_TRANSFORM(the_geom_webmercator,4326)) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
      ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
      ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
    end

    it "should create a the_geom_webmercator column with the_geom projected to 3785 even when schema is forced" do
      table = new_table :user_id => @user.id
      table.force_schema = "name varchar, the_geom geometry"
      table.save.reload

      lat = -43.941
      lon = 3.429
      pk = table.insert_row!({:name => "First check_in"})

      the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
      table.update_row!(pk, {:the_geom => the_geom})

      query_result = @user.run_query("select ST_X(ST_TRANSFORM(the_geom_webmercator,4326)) as lon, ST_Y(ST_TRANSFORM(the_geom_webmercator,4326)) as lat from #{table.name} where cartodb_id = #{pk} limit 1")
      ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
      ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
    end

    it "should be able to set a the_geom column from numeric latitude column and a longitude column" do
      table = Table.new
      table.user_id = @user.id
      table.name = 'Madrid Bars'
      table.force_schema = "name varchar, address varchar, latitude float, longitude float"
      table.save
      table.insert_row!({:name => "Hawai",
                         :address => "Calle de Pérez Galdós 9, Madrid, Spain",
                         :latitude => 40.423012,
                         :longitude => -3.699732})

      table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)

      # Check if the schema stored in memory is fresh and contains latitude and longitude still
      check_schema(table, [
        [:cartodb_id, "number"], [:name, "string"], [:address, "string"],
        [:the_geom, "geometry", "geometry", "point"], [:created_at, "date"], [:updated_at, "date"],
        [:latitude, "number"], [:longitude, "number"]
      ], :cartodb_types => true)

      # confirm coords are correct
      res = table.sequel.select{[st_x(the_geom),st_y(the_geom)]}.first
      res.should == {:st_x=>-3.699732, :st_y=>40.423012}
    end

    it "should be able to set a the_geom column from dirty string latitude and longitude columns" do
      table = Table.new
      table.user_id = @user.id
      table.name = 'Madrid Bars'
      table.force_schema = "name varchar, address varchar, latitude varchar, longitude varchar"
      table.save

      table.insert_row!({:name => "Hawai",
                         :address => "Calle de Pérez Galdós 9, Madrid, Spain",
                         :latitude => "40.423012",
                         :longitude => " -3.699732 "})

      table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)

      # Check if the schema stored in memory is fresh and contains latitude and longitude still
      check_schema(table, [
        [:cartodb_id, "number"], [:name, "string"], [:address, "string"],
        [:the_geom, "geometry", "geometry", "point"], [:created_at, "date"], [:updated_at, "date"],
        [:latitude, "string"], [:longitude, "string"]
      ], :cartodb_types => true)

      # confirm coords are correct
      res = table.sequel.select{[st_x(the_geom),st_y(the_geom)]}.first
      res.should == {:st_x=>-3.699732, :st_y=>40.423012}
    end

    context "geojson tests" do
      it "should return a geojson for the_geom if it is a point" do
        table = new_table :user_id => @user.id
        table.the_geom_type = "point"
        table.save.reload

        lat = -43.941
        lon = 3.429
        the_geom = %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
        pk = table.insert_row!({:name => "First check_in", :the_geom => the_geom})

        records = table.records(:page => 0, :rows_per_page => 1)
        RGeo::GeoJSON.decode(records[:rows][0][:the_geom], :json_parser => :json).as_text.should == "POINT (#{"%.3f" % lon} #{"%.3f" % lat})"

        record = table.record(pk)
        RGeo::GeoJSON.decode(record[:the_geom], :json_parser => :json).as_text.should == "POINT (#{"%.3f" % lon} #{"%.3f" % lat})"
      end

      it "should raise an error when the geojson provided is invalid" do
        table = new_table :user_id => @user.id
        table.save.reload

        lat = -43.941
        lon = 3.429
        the_geom = %Q{\{"type":""""Point","coordinates":[#{lon},#{lat}]\}}
        lambda {
          table.insert_row!({:name => "First check_in", :the_geom => the_geom})
        }.should raise_error(CartoDB::InvalidGeoJSONFormat)
      end

    end
  end

  context "migrate existing postgresql tables into cartodb" do
    it "create table via SQL statement and then migrate table into CartoDB" do
      table = new_table :name => nil, :user_id => @user.id
      table.migrate_existing_table = "exttable"

      @user.run_pg_query("CREATE TABLE exttable (go VARCHAR, ttoo INT, bed VARCHAR)")
      @user.run_pg_query("INSERT INTO exttable (go, ttoo, bed) VALUES ( 'c', 1, 'p');
                          INSERT INTO exttable (go, ttoo, bed) VALUES ( 'c', 2, 'p')")
      table.save
      table.name.should == 'exttable'
      table.rows_counted.should == 2
    end

    it "create and migrate a table containing a the_geom and cartodb_id" do
      delete_user_data @user
      table = new_table :name => nil, :user_id => @user.id
      table.migrate_existing_table = "exttable"

      @user.run_pg_query("CREATE TABLE exttable (the_geom VARCHAR, cartodb_id INT, bed VARCHAR)")
      @user.run_pg_query("INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( 'c', 1, 'p');
                         INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( 'c', 2, 'p')")
      table.save
      table.name.should == 'exttable'
      table.rows_counted.should == 2
    end

    it "create and migrate a table containing a valid the_geom" do
      delete_user_data @user
      @user.run_pg_query("CREATE TABLE exttable (cartodb_id INT, bed VARCHAR)")
      @user.run_pg_query("SELECT AddGeometryColumn ('exttable','the_geom',4326,'POINT',2);")
      @user.run_pg_query("INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( ST_GEOMETRYFROMTEXT('POINT(10 14)',4326), 1, 'p');
                         INSERT INTO exttable (the_geom, cartodb_id, bed) VALUES ( ST_GEOMETRYFROMTEXT('POINT(22 34)',4326), 2, 'p')")

      data_import = DataImport.create( :user_id       => @user.id,
                                       :migrate_table => 'exttable')

      table = Table[data_import.table_id]
      table.name.should == 'exttable'
      table.rows_counted.should == 2
      check_schema(table, [[:cartodb_id, "integer"], [:bed, "text"], [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"], [:the_geom, "geometry", "geometry", "point"]])
    end
  end
  context "merging two+ tables" do
    it "should merge two twitters.csv" do
      # load a table to treat as our 'existing' table
      table = new_table :user_id => @user.id
      table.name = 'twitters'
      importer, errors = create_import @user, "#{Rails.root}/db/fake_data/twitters.csv"

      table.migrate_existing_table = importer[0].name
      table.save.reload

      #create a second table from a file to treat as the data we want to append
      append_this = new_table :user_id => @user.id
      importer, errors = create_import @user, "#{Rails.root}/db/fake_data/clubbing.csv"
      append_this.migrate_existing_table = importer[0].name
      append_this.save.reload

      # envoke the append_to_table method
      table.append_to_table(:from_table => append_this)
      table.save.reload
      # append_to_table doesn't automatically destroy the table
      append_this.destroy

      Table[append_this.id].should == nil
      table.name.should match(/^twitters/)
      table.rows_counted.should == 2005
    end

    it "should import and then export file twitters.csv" do
      delete_user_data @user
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/twitters.csv' )
      table = Table[data_import.table_id]

      table.name.should match(/^twitters/)
      table.rows_counted.should == 7

      # write CSV to tempfile and read it back
      csv_content = nil
      zip = table.to_csv
      file = Tempfile.new('zip')
      File.open(file,'w+') { |f| f.write(zip) }

      Zip::ZipFile.foreach(file) do |entry|
        entry.name.should == "twitters.csv"
        csv_content = entry.get_input_stream.read
      end
      file.close

      # parse constructed CSV and test
      parsed = CSV.parse(csv_content)
      parsed[0].should == ["cartodb_id", "country", "field_5", "followers_count", "login", "url", "created_at", "updated_at", "the_geom"]
      parsed[1].first.should == "1"
    end

    it "should import and then export file SHP1.zip" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/SHP1.zip' )
      table = Table[data_import.table_id]
      table.name.should == "esp_adm1"

      # write CSV to tempfile and read it back
      shp_content = nil
      zip = table.to_shp
      file_ct = 0
      file = Tempfile.new('zip')
      File.open(file,'w+') { |f| f.write(zip) }
      Zip::ZipFile.foreach(file) do |entry|
        file_ct = file_ct + 1
      end
      file.close
      file_ct.should == 4
    end

    it "should import and then export file SHP1.zip as kml" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :data_source   => '/../db/fake_data/SHP1.zip' )
      table = Table[data_import.table_id]

      # write CSV to tempfile and read it back
      shp_content = nil
      zip = table.to_kml
      file_ct = 0
      file = Tempfile.new('zip')
      File.open(file,'w+') { |f| f.write(zip) }
      Zip::ZipFile.foreach(file) do |entry|
        file_ct = file_ct + 1
      end
      file.close
      file_ct.should == 1
    end

    it "should import and then export file SHP1.zip as sql" do
      data_import = DataImport.create( :user_id       => @user.id,
                                       :table_name    => 'esp_adm1',
                                       :data_source   => '/../db/fake_data/SHP1.zip' )
      table = Table[data_import.table_id]

      # write SQL to tempfile and read it back
      shp_content = nil
      zip = table.to_sql
      file_ct = 0
      file = Tempfile.new('zip')
      File.open(file,'w+') { |f| f.write(zip) }
      Zip::ZipFile.foreach(file) do |entry|
        file_ct = file_ct + 1
      end
      file.close
      file_ct.should == 1
    end
  end

  context "search" do

    it "should find tables by description" do
      table = Table.new
      table.user_id = @user.id
      table.name = "clubbing_spain_1_copy"
      table.description = "A world borders shapefile suitable for thematic mapping applications. Contains polygon borders in two resolutions as well as longitude/latitude values and various country codes. Camión"
      table.save.reload

      ['borders', 'polygons', 'spain', 'countries'].each do |query|
        tables = Table.search(query)
        tables.should_not be_empty
        tables.first.id.should == table.id
      end
      tables = Table.search("wadus")
      tables.should be_empty
    end

    it "should find tables by name" do
      table = Table.new
      table.user_id = @user.id
      table.name = "european_countries_1"
      table.description = "A world borders shapefile suitable for thematic mapping applications. Contains polygon borders in two resolutions as well as longitude/latitude values and various country codes"
      table.save.reload

      tables = Table.search("eur")
      tables.should_not be_empty
      tables.first.id.should == table.id
    end

  end

  context "retrieving tables from ids" do
    it "should be able to find a table by name or by identifier" do
      table = new_table :user_id => @user.id
      table.name = 'awesome name'
      table.save.reload

      Table.find_by_identifier(@user.id, table.id).id.should == table.id
      Table.find_by_identifier(@user.id, table.name).id.should == table.id
      lambda {
        Table.find_by_identifier(666, table.name)
      }.should raise_error
      lambda {
        Table.find_by_identifier(666, table.id)
      }.should raise_error
    end

    it "should be able to be found from username and id" do
      delete_user_data @user
      data_import = DataImport.create( :user_id       => @user.id,
                                       :table_name    => 'esp_adm1',
                                       :data_source   => '/../db/fake_data/with_cartodb_id.csv' )
      table = Table[data_import.table_id]
      new_table = Table.find_by_subdomain(@user.username, table.id)

      new_table.id.should == table.id
    end

    it "should not be able to be found from blank subdomain and id" do
      delete_user_data @user
      data_import = DataImport.create( :user_id       => @user.id,
                                       :table_name    => 'esp_adm1',
                                       :data_source   => '/../db/fake_data/with_cartodb_id.csv' )
      table = Table[data_import.table_id]

      new_table = Table.find_by_subdomain(nil, table.id)

      new_table.should == nil
    end
  end

end


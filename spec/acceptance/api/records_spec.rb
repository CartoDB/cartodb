# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 records management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user = create_user({:username => 'test'})
  end

  before(:each) do
    delete_user_data @user
    @table = create_table :user_id => @user.id
  end

  scenario "Get the records from a table" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "select", any_parameters).times(3)
    
    10.times do
      @table.insert_row!({:name => String.random(10), :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})
    end

    content = @user.run_query("select * from \"#{@table.name}\"")[:rows]

    get_json api_table_records_url(@table.name, :rows_per_page => 2) do |response|
      response.status.should be_success
      response.body[:id].should == @table.id
      response.body[:name].should == @table.name
      response.body[:total_rows].should == 10
      response.body[:rows][0].symbolize_keys.slice(:cartodb_id, :name, :location, :description).
        should == content[0].slice(:cartodb_id, :name, :location, :description)
      response.body[:rows][1].symbolize_keys.slice(:cartodb_id, :name, :location, :description).
        should == content[1].slice(:cartodb_id, :name, :location, :description)
    end

    get_json api_table_records_url(@table.name, :rows_per_page => 2, :page => 1) do |response|
      response.status.should be_success
      response.body[:rows].size.should == 2
      response.body[:rows][0].symbolize_keys.slice(:cartodb_id, :name, :location, :description).should == content[2].slice(:cartodb_id, :name, :location, :description)
      response.body[:rows][1].symbolize_keys.slice(:cartodb_id, :name, :location, :description).should == content[3].slice(:cartodb_id, :name, :location, :description)
    end

    get_json api_table_records_url(@table.name, :rows_per_page => 6, :page=>0) do |response|
      response.status.should be_success
      response.body[:rows][0].symbolize_keys.slice(:cartodb_id, :name, :location, :description).should == content[0].slice(:cartodb_id, :name, :location, :description)
      response.body[:rows][1].symbolize_keys.slice(:cartodb_id, :name, :location, :description).should == content[1].slice(:cartodb_id, :name, :location, :description)
      response.body[:rows][2].symbolize_keys.slice(:cartodb_id, :name, :location, :description).should == content[2].slice(:cartodb_id, :name, :location, :description)
      response.body[:rows][3].symbolize_keys.slice(:cartodb_id, :name, :location, :description).should == content[3].slice(:cartodb_id, :name, :location, :description)
      response.body[:rows][4].symbolize_keys.slice(:cartodb_id, :name, :location, :description).should == content[4].slice(:cartodb_id, :name, :location, :description)
      response.body[:rows][5].symbolize_keys.slice(:cartodb_id, :name, :location, :description).should == content[5].slice(:cartodb_id, :name, :location, :description)
    end
  end
  
  scenario "Get the records from a table sorted by some column, ascending or descending" do
    10.times do |i|
      @table.insert_row!({:name => "Name ##{i}", :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})
    end

    content = @user.run_query("select * from \"#{@table.name}\"")[:rows]
    
    get_json api_table_records_url(@table.name, :order_by => 'name', :mode => 'asc') do |response|
      response.status.should be_success
      response.body[:id].should == @table.id
      response.body[:name].should == @table.name
      response.body[:total_rows].should == 10
      response.body[:rows][0].symbolize_keys.slice(:cartodb_id, :name, :location, :description).
        should == content[0].slice(:cartodb_id, :name, :location, :description)
      response.body[:rows][1].symbolize_keys.slice(:cartodb_id, :name, :location, :description).
        should == content[1].slice(:cartodb_id, :name, :location, :description)
    end
    
    get_json api_table_records_url(@table.name, :order_by => 'name', :mode => 'desc') do |response|
      response.status.should be_success
      response.body[:id].should == @table.id
      response.body[:name].should == @table.name
      response.body[:total_rows].should == 10
      response.body[:rows][0].symbolize_keys.slice(:cartodb_id, :name, :location, :description).
        should == content[9].slice(:cartodb_id, :name, :location, :description)
      response.body[:rows][1].symbolize_keys.slice(:cartodb_id, :name, :location, :description).
        should == content[8].slice(:cartodb_id, :name, :location, :description)
    end
  end

  scenario "Insert a new row and get the record" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "insert", any_parameters).once
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "select", any_parameters).once
    
    post_json api_table_records_url(@table.name), {
        :name => "Name 123",
        :description => "The description"
    } do |response|
      response.status.should be_success
      response.body[:cartodb_id].should == 1
    end

    get_json api_table_record_url(@table.name,1) do |response|
      response.status.should be_success
      response.body[:cartodb_id].should == 1
      response.body[:name].should == "Name 123"
      response.body[:description].should == "The description"
    end
  end

  scenario "Get a record that doesn't exist" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "select", any_parameters).never
    
    get_json api_table_record_url(@table.name,1) do |response|
      response.status.should == 404
    end
  end

  scenario "Update a row" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "update", any_parameters).once
    
    pk = @table.insert_row!({:name => String.random(10), :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})

    put_json api_table_record_url(@table.name,pk), {
      :name => "Name updated",
      :description => "Description updated"
    } do |response|
      response.status.should == 200
    end
  end

  scenario "Update a row that doesn't exist" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "update", any_parameters).never
    
    put_json api_table_record_url(@table.name,1), {
      :name => "Name updated",
      :description => "Description updated"
    } do |response|
      response.status.should == 404
    end
  end

  scenario "Remove a row" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "delete", any_parameters).once
    
    pk = @table.insert_row!({:name => String.random(10), :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})

    delete_json api_table_record_url(@table.name,pk) do |response|
      response.status.should be_success
    end
    @table.rows_counted.should == 0
  end

  scenario "Remove multiple rows" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "delete", any_parameters).once
    
    pk  = @table.insert_row!({:name => String.random(10), :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})
    pk2 = @table.insert_row!({:name => String.random(10), :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})
    pk3 = @table.insert_row!({:name => String.random(10), :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})
    pk4 = @table.insert_row!({:name => String.random(10), :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})

    delete_json api_table_record_url(@table.name,"#{pk},#{pk2},#{pk3}") do |response|
      response.status.should be_success
    end
    @table.rows_counted.should == 1
  end

  scenario "Get the value from a column in a given record" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "select", any_parameters).once
    
    pk = @table.insert_row!({:name => "Blat", :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})

    get_json api_table_record_column_url(@table.name,pk,:name) do |response|
      response.status.should be_success
      response.body[:name].should == "Blat"
    end
  end

  scenario "Update the value from a column in a given record" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "update", any_parameters).once
    
    pk = @table.insert_row!({:name => "Blat", :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}})

    put_json api_table_record_column_url(@table.name,pk,:name), {:value => "Fernando Blat"} do |response|
      response.status.should be_success
      response.body[:name].should == "Fernando Blat"
    end
  end
  
  scenario "Create a new row of type number and insert float values" do
    table_id = nil

    post_json api_tables_url, {
      :name => "My new imported table",
      :schema => "name varchar, age integer"
    } do |response|
      response.status.should be_success
      table_id = response.body[:name]
    end

    post_json api_table_records_url(table_id), {
        :name => "Fernando Blat",
        :age => "29"
    } do |response|
      response.status.should be_success
    end

    row_id = nil
    post_json api_table_records_url(table_id), {
        :name => "Beatriz",
        :age => "30.2"
    } do |response|
      response.status.should be_success
      row_id = response.body[:cartodb_id]
    end
    
    get_json api_table_columns_url(table_id) do |response|
      response.status.should be_success
      response.body.should include(["age", "number"])
    end
    
    get_json api_table_record_column_url(table_id,row_id,:age) do |response|
      response.status.should be_success
      response.body.should == {:age => 30.2}
    end    
  end

  scenario "Create a new row including the_geom field" do
    lat = Float.random_latitude
    lon = Float.random_longitude
    pk = nil
    
    post_json api_table_records_url(@table.name), {
        :name => "Fernando Blat",
        :description => "Geolocated programmer",
        :the_geom => %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    } do |response|
      response.status.should be_success
      pk = response.body[:cartodb_id]
    end
    
    query_result = @user.run_query(CartoDB::SqlParser.parse("select longitude(the_geom) as lon, latitude(the_geom) as lat from #{@table.name} where cartodb_id = #{pk} limit 1"))
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end

  scenario "Update a row including the_geom field" do    
    lat = Float.random_latitude
    lon = Float.random_longitude
    pk = nil
    
    post_json api_table_records_url(@table.name), {
        :name => "Fernando Blat",
        :description => "Geolocated programmer"
    } do |response|
      response.status.should be_success
      pk = response.body[:cartodb_id]
    end
    
    put_json api_table_record_url(@table.name,1), {
      :the_geom => %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    } do |response|
      response.status.should be_success
    end
    
    query_result = @user.run_query(CartoDB::SqlParser.parse("select longitude(the_geom) as lon, latitude(the_geom) as lat from #{@table.name} where cartodb_id = #{pk} limit 1"))
    ("%.3f" % query_result[:rows][0][:lon]).should == ("%.3f" % lon)
    ("%.3f" % query_result[:rows][0][:lat]).should == ("%.3f" % lat)
  end
  
end

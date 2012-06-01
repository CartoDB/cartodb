# coding: UTF-8

require 'spec_helper'

describe CartoDB::Exporter do
  it "should return the content of the table in CSV format" do
    # build up a new table
    user               = create_user
    table              = Table.new :privacy => Table::PRIVATE, :tags => 'movies, personal'
    table.user_id      = user.id
    table.name         = 'Madrid Bars'
    table.force_schema = "name varchar, address varchar, latitude float, longitude float"
    table.save
    table.insert_row!({:name      => "Hawai", 
                       :address   => "Calle de Pérez Galdós 9, Madrid, Spain", 
                       :latitude  => 40.423012, 
                       :longitude => -3.699732})
                     
    table.georeference_from!(:latitude_column  => :latitude, 
                             :longitude_column => :longitude)

    # write CSV to tempfile and read it back
    csv_content = nil
    zip = table.to_csv
    file = Tempfile.new('zip')
    File.open(file,'w+') { |f| f.write(zip) }
  
    Zip::ZipFile.foreach(file) do |entry|
      entry.name.should == "madrid_bars_export.csv"
      csv_content = entry.get_input_stream.read
    end
    file.close
  
    # parse constructed CSV and test
    parsed = CSV.parse(csv_content)
    parsed[0].should == ["cartodb_id", "address", "latitude", "longitude", "name", "updated_at", "created_at", "the_geom"]
    parsed[1].first.should == "1"
    parsed[1].last.should  ==  "{\"type\":\"Point\",\"coordinates\":[-3.699732,40.423012]}"
  end

  it "should return the content of a brand new table in SHP format" do
    table = create_table :name => 'table1'
    table.insert_row!({:name => "name #1", :description => "description #1"})
  
    zip = table.to_shp
    path = "/tmp/temp_shp.zip"
    fd = File.open(path,'w+')
    fd.write(zip)
    fd.close
    Zip::ZipFile.foreach(path) do |entry|
      %W{ table1_export.shx table1_export.shp table1_export.dbf table1_export.prj }.should include(entry.name)
    end
    FileUtils.rm_rf(path)
  end

  it "should return the content of a populated table in SHP format" do
    user = create_user
    table = new_table
    table.import_from_file = "#{Rails.root}/db/fake_data/import_csv_1.csv"
    table.user_id = user.id
    table.name = "import_csv_1"
    table.save
  
    # FIXME: At some point georeferencing an imported table won't be necessary here
    table.georeference_from!(:latitude_column => "lat", :longitude_column => "lon")
  
    zip = table.to_shp
    path = "/tmp/temp_shp.zip"
    fd = File.open(path,'w+')
    fd.write(zip)
    fd.close
    Zip::ZipFile.foreach(path) do |entry|
      %W{ import_csv_1_export.shx import_csv_1_export.shp import_csv_1_export.dbf import_csv_1_export.prj }.should include(entry.name)
    end
    FileUtils.rm_rf(path)
  end
end

# coding: UTF-8

require 'spec_helper'
require File.expand_path("../cartodb-importer/lib/cartodb-importer")

describe CartoDB::Importer do
  it "should raise an error if :import_from_file option is blank" do
    lambda { 
      CartoDB::Importer.new 
    }.should raise_error("import_from_file value can't be nil")
  end
  
  it "should get the name from the options" do
    importer = CartoDB::Importer.new :import_from_file => File.expand_path("../cartodb-importer/spec/support/data/clubbing.csv"),
                                     :database => "cartodb_importer_test", :username => 'postgres', :password => '',
                                     :host => 'localhost', :port => 5432, :suggested_name => 'prefered_name'
    result = importer.import!
    result.name.should == 'prefered_name'
    result.rows_imported.should == 2003
    result.import_type.should == '.csv'
  end
  
  it "should remove the table from the database if an exception happens" do
    options = { :import_from_file => File.expand_path("../cartodb-importer/spec/support/data/empty.csv"),
                :database => "cartodb_importer_test", :username => 'postgres', :password => '',
                :host => 'localhost', :port => 5432 }
    importer = CartoDB::Importer.new options
    lambda { 
      importer.import!
    }.should raise_error
    
    db_configuration = options.slice(:database, :username, :password, :host, :port)
    db_configuration[:port] ||= 5432
    db_configuration[:host] ||= '127.0.0.1'
    db_connection = Sequel.connect("postgres://#{db_configuration[:username]}:#{db_configuration[:password]}@#{db_configuration[:host]}:#{db_configuration[:port]}/#{db_configuration[:database]}")
    db_connection.tables.should_not include(:empty)
  end
  
  it "should suggest a new table name of the format _n if the previous table exists" do
    importer = CartoDB::Importer.new :import_from_file => File.expand_path("../cartodb-importer/spec/support/data/clubbing.csv"),
                                     :database => "cartodb_importer_test", :username => 'postgres', :password => '',
                                     :host => 'localhost', :port => 5432, :suggested_name => 'prefered_name'
    result = importer.import!
    result.name.should == 'prefered_name'
    result.rows_imported.should == 2003
    result.import_type.should == '.csv'

    importer = CartoDB::Importer.new :import_from_file => File.expand_path("../cartodb-importer/spec/support/data/clubbing.csv"),
                                     :database => "cartodb_importer_test", :username => 'postgres', :password => '',
                                     :host => 'localhost', :port => 5432, :suggested_name => 'prefered_name'
    result = importer.import!
    result.name.should == 'prefered_name_2'
    result.rows_imported.should == 2003
    result.import_type.should == '.csv'
  end

  describe "#CSV" do
    it "should import a CSV file in the given database in a table named like the file" do
      importer = CartoDB::Importer.new :import_from_file => File.expand_path("../cartodb-importer/spec/support/data/clubbing.csv"),
                                       :database => "cartodb_importer_test", :username => 'postgres', :password => '',
                                       :host => 'localhost', :port => 5432
      result = importer.import!
      result.name.should == 'clubbing'
      result.rows_imported.should == 2003
      result.import_type.should == '.csv'
    end
  end
  
  describe "#XLSX" do
    it "should import a XLSX file in the given database in a table named like the file" do
      importer = CartoDB::Importer.new :import_from_file => File.expand_path("../cartodb-importer/spec/support/data/ngos.xlsx"),
                                       :database => "cartodb_importer_test", :username => 'postgres', :password => '',
                                       :host => 'localhost', :port => 5432
      result = importer.import!
      result.name.should == 'ngos'
      result.rows_imported.should == 76
      result.import_type.should == '.xlsx'
    end
  end
  
  describe "#SHP" do
    it "should import a SHP file in the given database in a table named like the file" do
      importer = CartoDB::Importer.new :import_from_file => File.expand_path("../cartodb-importer/spec/support/data/EjemploVizzuality.zip"),
                                       :database => "cartodb_importer_test", :username => 'postgres', :password => '',
                                       :host => 'localhost', :port => 5432
      result = importer.import!
      result.name.should == 'vizzuality_shp'
      result.rows_imported.should == 11
      result.import_type.should == '.shp'
    end
    
    it "should import SHP file TM_WORLD_BORDERS_SIMPL-0.3.zip" do
      importer = CartoDB::Importer.new :import_from_file => File.expand_path("../cartodb-importer/spec/support/data/TM_WORLD_BORDERS_SIMPL-0.3.zip"),
                                       :database => "cartodb_importer_test", :username => 'postgres', :password => '',
                                       :host => 'localhost', :port => 5432
      result = importer.import!
      result.name.should == 'tm_world_borders_simpl_0_3_shp'
      result.rows_imported.should == 246
      result.import_type.should == '.shp'
    end
  end
end
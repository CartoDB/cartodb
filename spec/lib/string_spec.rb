require 'spec_helper'

describe String do
  describe "Convert from SQL data type to CartoDB types" do
    it "should convert smallint to number" do
      "smallint".convert_to_cartodb_type.should == "number"
    end
    it "should convert numeric(\d+,\d+) to number" do
      "numeric(10,0)".convert_to_cartodb_type.should == "number"
    end
    it "should convert integer to number" do
      "integer".convert_to_cartodb_type.should == "number"
    end
    it "should convert real to number" do
      "real".convert_to_cartodb_type.should == "number"
    end
    it "should convert double precision to number" do
      "double precision".convert_to_cartodb_type.should == "number"
    end
    it "should convert varchar to string" do
      "varchar".convert_to_cartodb_type.should == "string"
    end
    it "should convert text to string" do
      "text".convert_to_cartodb_type.should == "string"
    end
    it "should convert character varying to string" do
      "character varying".convert_to_cartodb_type.should == "string"
    end
    it "should convert varchar to string" do
      "varchar".convert_to_cartodb_type.should == "string"
    end
    it "should convert character varying(20) to string" do
      "character varying(20)".convert_to_cartodb_type.should == "string"
    end
    it "should convert timestamp to date" do
      "timestamp".convert_to_cartodb_type.should == "timestamp"
    end
    it "should convert timestamp without time zone to date" do
      "timestamp without time zone".convert_to_cartodb_type.should == "date"
    end
    it "should convert boolean to boolean" do
      "boolean".convert_to_cartodb_type.should == "boolean"
    end
  end
  describe "Convert from CartoDB types to the first SQL type" do
    it "should convert number to smallint" do
      "number".convert_to_db_type.should == "double precision"
    end
    it "should convert string to varchar" do
      "string".convert_to_db_type.should == "text"
    end
    it "should convert date to timestamp" do
      "date".convert_to_db_type.should == "timestamptz"
    end
    it "should convert boolean to boolean" do
      "boolean".convert_to_db_type.should == "boolean"
    end
  end
end

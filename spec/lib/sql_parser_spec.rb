# coding: UTF-8

require 'spec_helper'

describe CartoDB::SqlParser do
  it "should return the affected tables" do
    sql = ""
    CartoDB::SqlParser.new(sql).affected_tables.should == ['restaurants']
  end
end

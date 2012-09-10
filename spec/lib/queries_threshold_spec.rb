# coding: UTF-8

require 'spec_helper'

describe CartoDB::QueriesThreshold do

  before :each do
    $threshold.flushdb
  end

  it "should get and increase" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.incr(1, "other")
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 1
  end

  it "should get and increase including time if time given" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.incr(1, "other", 0.005)
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "time").should == 0.005
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d"), "time").should == 0.005
  end

  it "should increase the total absolute and the total of the day and the month" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 0
    CartoDB::QueriesThreshold.get(1, "total").should == 0

    CartoDB::QueriesThreshold.incr(1, "other")

    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 1
    CartoDB::QueriesThreshold.get(1, "total").should == 1
  end

  it "should increase select queries" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 0
    CartoDB::QueriesThreshold.get(1, "total").should == 0

    CartoDB::QueriesThreshold.incr(1, "select")

    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 1
    CartoDB::QueriesThreshold.get(1, "total").should == 1
  end

  it "should increase insert queries" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 0
    CartoDB::QueriesThreshold.get(1, "total").should == 0

    CartoDB::QueriesThreshold.incr(1, "insert")

    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 1
    CartoDB::QueriesThreshold.get(1, "total").should == 1
  end

  it "should increase update queries" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 0
    CartoDB::QueriesThreshold.get(1, "total").should == 0

    CartoDB::QueriesThreshold.incr(1, "update")

    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 1
    CartoDB::QueriesThreshold.get(1, "total").should == 1
  end

  it "should increase delete queries" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 0
    CartoDB::QueriesThreshold.get(1, "total").should == 0

    CartoDB::QueriesThreshold.incr(1, "delete")

    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 1
    CartoDB::QueriesThreshold.get(1, "total").should == 1
  end

  it "should increase other queries" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 0
    CartoDB::QueriesThreshold.get(1, "total").should == 0

    CartoDB::QueriesThreshold.incr(1, "other")

    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 1
    CartoDB::QueriesThreshold.get(1, "total").should == 1
  end

  it "should increase multiple times" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 0
    CartoDB::QueriesThreshold.get(1, "total").should == 0

    CartoDB::QueriesThreshold.incr(1, "select")
    CartoDB::QueriesThreshold.incr(1, "select")
    CartoDB::QueriesThreshold.incr(1, "select")

    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 3
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 3
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 3
    CartoDB::QueriesThreshold.get(1, "total").should == 3
  end

  it "should implement a query analyzer to increment the threshold for raw queries" do
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 0
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 0
    CartoDB::QueriesThreshold.get(1, "total").should == 0

    CartoDB::QueriesThreshold.analyze(1, "select id from wadus")
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 1

    CartoDB::QueriesThreshold.analyze(1, "select id from wadus; select what from tradus")
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 3

    CartoDB::QueriesThreshold.analyze(1, "insert into wadus (name, address) values ('a name', 'an address'); ")
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 3
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 1

    CartoDB::QueriesThreshold.analyze(1, "insert into wadus (name, address) values ('a name', 'an address'); update wadus set name='tradus' where id=33")
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 3
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 2
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 1

    CartoDB::QueriesThreshold.analyze(1, "delete from wadus; drop table wadus")
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "select").should == 3
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "insert").should == 2
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "update").should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "delete").should == 1
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m"), "other").should == 1

    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m")).should == 8
    CartoDB::QueriesThreshold.get(1, Date.today.strftime("%Y-%m-%d")).should == 8
    CartoDB::QueriesThreshold.get(1, "total").should == 8
  end


end

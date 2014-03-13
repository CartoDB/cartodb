require 'spec_helper'
require_relative '../../lib/cartodb/metrics'

describe CartoDB::Metrics do
  before(:all) do
    @metrics = CartoDB::Metrics.new
    Cartodb.config[:ducksboard] = {
      "formats" => {"csv" => {"failed" => 1, "total" => 2}},
      "totals" => {"failed" => 3, "success" => 4}
    }
  end
  it "should prefix all hash keys with import_ except username, distinct_id and account_Type for Mixpanel" do
    metrics = CartoDB::Metrics.new
    metrics.mixpanel_payload({username: "asdf", account_type: "Godzilla", error: 3, extension: 34, distinct_id: "aasdf"})
      .should == {username: "asdf", account_type: "Godzilla", import_error: 3, import_extension: 34, distinct_id: "aasdf"}

  end
  it "should increase total and failed counters for a failed CSV file" do
    metrics = CartoDB::Metrics.new
    metrics.expects(:ducksboard_increment)
      .with(Cartodb.config[:ducksboard]['totals']['failed'], 1).returns(true)
    metrics.expects(:ducksboard_increment)
      .with(Cartodb.config[:ducksboard]["formats"]['csv']['total'], 1).returns(true)
    metrics.expects(:ducksboard_increment)
      .with(Cartodb.config[:ducksboard]["formats"]['csv']['failed'], 1).returns(true)
    metrics.ducksboard_report_failed("csv")
  end
  
  it "should increase total and success counters for a successful CSV file" do
    metrics = CartoDB::Metrics.new
    metrics.expects(:ducksboard_increment)
      .with(Cartodb.config[:ducksboard]['totals']['success'], 1).returns(true)
    metrics.expects(:ducksboard_increment)
      .with(Cartodb.config[:ducksboard]["formats"]['csv']['total'], 1).returns(true)
    metrics.ducksboard_report_done("csv")
  end
end

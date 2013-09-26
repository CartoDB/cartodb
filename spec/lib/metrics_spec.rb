require 'spec_helper'

describe CartoDB::Metrics do
  before(:all) do
    @metrics = CartoDB::Metrics.new
    Cartodb.config[:ducksboard] = {
      "formats" => {"csv" => {"failed" => 1, "total" => 2}},
      "totals" => {"failed" => 3, "success" => 4}
    }
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

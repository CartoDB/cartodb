require 'spec_helper'
require_relative '../../lib/cartodb/metrics'

describe CartoDB::Metrics do
  describe "Import metrics" do
    before(:all) do
      @metrics = CartoDB::Metrics.new
      Cartodb.config[:ducksboard] = {
        "import" => {
          "formats" => { "csv" => {"failed" => 1, "total" => 2 } },
          "totals" => { "failed" => 3, "success" => 4 }
        },
        "geocoding" => {
          "kinds" => { "high_resolution" => { "success" =>  5, "failed" => 6, "nokia_hits" => 7, "cache_hits" => 8 } },
          "totals" => { "success" => 9, "failed" => 10, "revenue" => 11, "cost" => 12, "timeline" => 13 }
        }
      }
    end
    it "should prefix all hash keys with import_ except username, distinct_id and account_Type for Mixpanel" do
      metrics = CartoDB::Metrics.new
      metrics.mixpanel_payload(:import, {username: "asdf", account_type: "Godzilla", error: 3, extension: 34, distinct_id: "aasdf"})
        .should == {username: "asdf", account_type: "Godzilla", import_error: 3, import_extension: 34, distinct_id: "aasdf"}

    end

    describe "imports" do
      it "should increase total and failed counters for a failed CSV file" do
        metrics = CartoDB::Metrics.new
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['import']['totals']['failed'], 1).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['import']['formats']['csv']['total'], 1).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['import']['formats']['csv']['failed'], 1).returns(true)
        metrics.ducksboard_report_failed_import("csv")
      end

      it "should increase total and success counters for a successful CSV file" do
        metrics = CartoDB::Metrics.new
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['import']['totals']['success'], 1).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['import']['formats']['csv']['total'], 1).returns(true)
        metrics.ducksboard_report_successful_import("csv")
      end
    end

    describe "geocodings" do
      it "should increase counters for a high_resolution geocoding" do
        metrics = CartoDB::Metrics.new
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['geocoding']['totals']['success'], 100).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['geocoding']['totals']['failed'], 50).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['geocoding']['kinds']['high_resolution']['success'], 100).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['geocoding']['kinds']['high_resolution']['failed'], 50).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['geocoding']['kinds']['high_resolution']['nokia_hits'], 100).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['geocoding']['kinds']['high_resolution']['cache_hits'], 50).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['geocoding']['totals']['cost'], 5).returns(true)
        metrics.expects(:ducksboard_increment)
          .with(Cartodb.config[:ducksboard]['geocoding']['totals']['revenue'], 10).returns(true)

        metrics.ducksboard_report_geocoding({
          kind: 'high-resolution',
          successful_rows: 100,
          failed_rows: 50,
          cache_hits: 50,
          processed_rows: 100,
          cost: 5,
          price: 10
        })
      end
    end
  end
end

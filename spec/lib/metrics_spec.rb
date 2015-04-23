require 'spec_helper'
require_relative '../../lib/cartodb/metrics'

describe CartoDB::Metrics do
  describe "Import metrics" do
    before(:all) do
      @metrics = CartoDB::Metrics.new
    end
    it "should prefix all hash keys with import_ except username, distinct_id and account_Type for Mixpanel" do
      metrics = CartoDB::Metrics.new
      metrics.mixpanel_payload(:import, {username: "asdf", account_type: "Godzilla", error: 3, extension: 34, distinct_id: "aasdf"})
        .should == {username: "asdf", account_type: "Godzilla", import_error: 3, import_extension: 34, distinct_id: "aasdf"}

    end
  end
end

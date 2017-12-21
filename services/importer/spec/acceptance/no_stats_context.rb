shared_context "no stats" do

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
  end

end

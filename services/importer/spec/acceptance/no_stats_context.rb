shared_context "no stats" do

  before(:each) do
    allow(CartoDB::Stats::Aggregator).to receive(:read_config).and_return({})
  end

end

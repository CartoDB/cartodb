module MetricsHelper
  def bypass_metrics
    allow_any_instance_of(Carto::Tracking::Events::Event).to receive(:report!).and_return(true)
  end
end

module MetricsHelper
  def bypass_metrics
    Carto::Tracking::Events::Event.any_instance.stubs(:report!).returns(true)
  end
end

require 'mixpanel'

module CartoDB
  class Metrics
    def self.event(*args)
      if Cartodb.config[:mixpanel].present?
        tracker = Mixpanel::Tracker.new(Cartodb.config[:mixpanel]['token'])
        tracker.send(:track, args)
      end
    end
  end
end

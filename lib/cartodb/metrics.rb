require 'mixpanel'

module CartoDB
  class Metrics
    def self.event(*args)
      return self unless Cartodb.config[:mixpanel].present?
      token = Cartodb.config[:mixpanel]['token']
      Mixpanel::Tracker.new(token).send(:track, args)
    rescue => exception
      Rollbar.report_message(
        "Failed to send metric to Mixpanel",
        "error",
        error_info: args.join('-')
      )
      self
    end
  end
end


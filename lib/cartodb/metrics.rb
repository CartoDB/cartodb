require 'mixpanel'
require 'json'
require_relative 'github_reporter'

module CartoDB
  class Metrics

    def self.report_failed_import(metric_payload)
      CartoDB::Metrics.mixpanel_event("Import failed", metric_payload)
      CartoDB::Metrics.ducksboard_report_failed(metric_payload[:extension])
      CartoDB::GitHubReporter.new.report_failed_import(metric_payload)
    end #self.report_failed_import

    def self.mixpanel_event(*args)
      return self unless Cartodb.config[:mixpanel].present?
      token = Cartodb.config[:mixpanel]['token']
      Mixpanel::Tracker.new(token).send(:track, args)
    rescue => exception
      p exception
      Rollbar.report_message(
        "Failed to send metric to Mixpanel",
        "error",
        error_info: args.join('-')
      )
      self
    end #self.event

    def self.ducksboard_report_failed(type)
      if Cartodb.config[:ducksboard]["formats"][type.downcase].present?
        ducksboard_increment Cartodb.config[:ducksboard]["formats"][type.downcase]["failed"], 1
        ducksboard_increment Cartodb.config[:ducksboard]["formats"][type.downcase]["total"], 1
      end
    end #self.import_failed

    def self.ducksboard_report_done(type)
    	if Cartodb.config[:ducksboard]["formats"][type.downcase].present?
        ducksboard_increment Cartodb.config[:ducksboard]["formats"][type.downcase]["total"], 1
      end
    end #self.import_success

    def self.ducksboard_set(id, num)
    	ducksboard_post(id, {value: num})
      self
    end #self.ducksboard_post

    def self.ducksboard_increment(id, num)
    	ducksboard_post(id, {delta: num})
      self
    end #self.ducksboard_increment

    def self.ducksboard_post(id, body)
    	return self unless Cartodb.config[:ducksboard].present?
	    url = URI.parse("https://push.ducksboard.com/v/#{id}")
	    req = Net::HTTP::Post.new(url.path)
	    req.body = body.to_json
	    req.basic_auth Cartodb.config[:ducksboard]["id"], "unused"
	    req.content_type = 'application/json'
	    con = Net::HTTP.new(url.host, 443)
	    con.use_ssl = true
	    con.start {|http| http.request(req)}
    rescue => exception
      p Cartodb.config[:ducksboard]["id"]
      p exception
      Rollbar.report_message(
        "Failed to send metric to Ducksboard",
        "error",
        error_info: args.join('-')
      )
      self
    end #self.ducksboard_post
  end
end


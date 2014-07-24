require 'mixpanel'
require 'json'
require 'rollbar'

module CartoDB
  class Metrics
    def report(event, payload)
      return self unless event.present?
      if payload.fetch(:success, false)
        report_success(event, payload)
      else
        report_failure(event, payload)
      end
    rescue => exception
      self
    end #report

    def mixpanel_payload(event, metric_payload)
      return nil unless event.present?
      #remove the log from the payload
      payload = metric_payload.select {|k,v| k != :log }
      Hash[payload.map{ |key,value|
        [(["username","account_type", "distinct_id"].include?(key.to_s) ?
            key.to_s : "#{ event }_" + key.to_s),
          value]
        }].symbolize_keys
    end

    def report_failure(event, metric_payload)
      case event
      when :import
        mixpanel_event("Import failed", mixpanel_payload(event, metric_payload))
        ducksboard_report_failed(metric_payload[:extension])
        Rollbar.report_message("Failed import", "error", error_info: metric_payload)
      when :geocoding
        mixpanel_event("Geocoding failed", mixpanel_payload(event, metric_payload))
      end
    end #report_failure

    def report_success(event, metric_payload)
      case event
      when :import
        mixpanel_event("Import successful", mixpanel_payload(event, metric_payload))
        ducksboard_report_done(metric_payload[:extension])
      when :geocoding
        mixpanel_event("Geocoding successful", mixpanel_payload(event, metric_payload))
      end
    end #report_success

    def mixpanel_event(*args)
      return self unless Cartodb.config[:mixpanel].present?
      token = Cartodb.config[:mixpanel]['token']
      Mixpanel::Tracker.new(token).send(:track, *args)
    rescue => exception
      Rollbar.report_message(
        "Failed to send metric to Mixpanel",
        "error",
        error_info: args.join('-')
      )
      self
    end #mixpanel_event

    def ducksboard_report_failed(type="")
      return self unless type
      type.gsub!(".","")
      if Cartodb.config.fetch(:ducksboard, {}).fetch("totals", {})["failed"].present?
        ducksboard_increment Cartodb.config[:ducksboard]["totals"]["failed"], 1
      end
      if Cartodb.config.fetch(:ducksboard, {}).fetch("formats", {})[type.downcase].present?
        ducksboard_increment Cartodb.config[:ducksboard]["formats"][type.downcase]["failed"], 1
        ducksboard_increment Cartodb.config[:ducksboard]["formats"][type.downcase]["total"], 1
      end
    rescue
      self
    end #ducksboard_report_failed

    def ducksboard_report_done(type="")
      return self unless type
      type.gsub!(".","")
      if Cartodb.config.fetch(:ducksboard, {}).fetch("totals", {})["success"].present?
        ducksboard_increment Cartodb.config[:ducksboard]["totals"]["success"], 1
      end
      if Cartodb.config.fetch(:ducksboard, {}).fetch("formats", {})[type.downcase].present?
        ducksboard_increment Cartodb.config[:ducksboard]["formats"][type.downcase]["total"], 1
      end
    rescue
      self
    end #ducksboard_report_done

    def ducksboard_set(id, num)
    	ducksboard_post(id, { value: num })
      self
    end #ducksboard_set

    def ducksboard_increment(id, num)
    	ducksboard_post(id, { delta: num })
      self
    end #ducksboard_increment

    def ducksboard_post(id, body)
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
    end #ducksboard_post
  end
end


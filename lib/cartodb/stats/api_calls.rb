module CartoDB
  module Stats
    class APICalls

      # REDIS_SOURCES
      #   mapviews -> mapviews sent from tiler to redis
      #   mapviews_es -> mapviews sent from logs to redis
      REDIS_SOURCES = ['mapviews', 'mapviews_es']

      # This method will return an array without dates
      def get_api_calls_without_dates(username, options = {})
        calls = get_api_calls(username, options).map {|day, value| value}
        if options[:old_api_calls]
          raise "Cannot request old api calls with custom dates" if options[:to] or options[:from]
          # Add old api calls
          old_calls = get_old_api_calls(username) rescue []
          calls = calls.zip(old_calls).map { |pair|
            pair[0].to_i + pair[1].to_i
          } unless old_calls.blank?
        end
        return calls
      end

      # This method will never include old api calls
      # It will return a hash of dates with map views values
      def get_api_calls_with_dates(username, options = {})
        get_api_calls(username, options)
      end

      # Wrapper to get a total of api calls of a user or visualization
      # It doesn't include old api calls
      def get_total_api_calls(username, visualization_id = nil)
        get_total_api_calls_from_redis(username, visualization_id)
      end

      def get_api_calls(username, options = {})
        get_api_calls_from_redis(username, options)
      end

      # DEPRECATED
      # This method returns a 30 days ordered array
      # This array is populated from other tasks. It's not possible
      # to pass a days parameter to this method
      def get_old_api_calls(username)
        user_redis_key = ::User.where(:username => username).first.key
        calls = $users_metadata.HMGET(user_redis_key, 'api_calls').first
        if calls.nil? || calls['per_day'].nil?
          return []
        else
          JSON.parse(calls['per_day']).to_a.reverse
        end
      end

      # Iterate through all api calls redis sources and returns total
      # api calls of a user or a visualization
      def get_total_api_calls_from_redis(username, visualization_id = nil)
        calls = 0

        REDIS_SOURCES.each do |source|
          source_calls = get_total_api_calls_from_redis_source(username, source, visualization_id)
          if !source_calls.nil? and source_calls != 0
            calls = calls + source_calls
          end
        end

        return calls
      end

      # Iterate through all api calls redis sources and returns total
      # api calls per day
      def get_api_calls_from_redis(username, options = {})
        calls = {}

        REDIS_SOURCES.each do |source|
          source_calls = get_api_calls_from_redis_source(username, source, options)
          if calls.blank?
            calls = source_calls
          else
            if !source_calls.blank?
              source_calls.each do |day, value|
                if !value.nil?
                  calls[day] = (calls[day].nil? ? 0 : calls[day]) + value.to_i
                end
              end
            end
          end
        end

        return calls
      end

      # Get redis key based on username and visualization id
      def redis_api_call_key(username, api_call_type, visualization_id = nil)
        redis_base_key = "user:#{username}:#{api_call_type}"
        if visualization_id.nil?
          return "#{redis_base_key}:global"
        else
          return "#{redis_base_key}:stat_tag:#{visualization_id}"
        end
      end

      # Returns api calls from a redis key in a hash with dates
      def get_api_calls_from_redis_source(username, api_call_type, options = {})
        redis_key = redis_api_call_key(username, api_call_type, options[:stat_tag])
        date_to = (options[:to] ? options[:to].to_date : Date.today)
        date_from = (options[:from] ? options[:from].to_date : date_to - 29.days)

        # Retrieve matching months from Redis with ZSCAN
        # TODO: move to single request if Redis gem ever supports multiple matches
        calls = []
        matching_months_date = date_from.beginning_of_month
        while matching_months_date <= date_to
          $users_metadata.zscan_each(redis_key, match: "#{matching_months_date.strftime('%Y%m')}*") do |key|
            calls.push(key)
          end
          matching_months_date += 1.month
        end

        # Take only the date, score tuples (arrays), flatten (to remove array levels), group again date,score pairs and sort it by date desc
        calls_in_reverse_order = calls.select { |a| a.kind_of? Array }.flatten.each_slice(2).to_a.sort { |a1, a2| a1[0] <=> a2[0]}.reverse

        # Crop requested window
        last_requested_day = date_to.strftime("%Y%m%d")
        first_requested_day = date_from.strftime("%Y%m%d")
        if check_available_values(calls_in_reverse_order, first_requested_day, last_requested_day)
          first_requested_index = calls_in_reverse_order.index { |day_and_count|
            day_and_count[0] <= last_requested_day
          }
          calls_in_reverse_order = calls_in_reverse_order.drop(first_requested_index) if first_requested_index
          last_requested_index = calls_in_reverse_order.index { |day_and_count|
            day_and_count[0] <= first_requested_day
          }
          calls_in_reverse_order = calls_in_reverse_order.take(last_requested_index + 1) if last_requested_index
        else
          calls_in_reverse_order = {}
        end

        # Fill gaps
        whole_range_zero = {}
        date_to.downto(date_from) do |date|
          stat_date = date.strftime("%Y%m%d")
          whole_range_zero[stat_date] = 0
        end

        whole_range_zero.merge(Hash[*calls_in_reverse_order.flatten])
      end

      def check_available_values(values, date_from, date_to)
        values.select { |value| value[0] >= date_from && value[0] <= date_to }.length > 0
      end

      # Returns total api calls from a redis key
      def get_total_api_calls_from_redis_source(username, api_call_type, visualization_id = nil)
        raise "Total api calls per user is not supported yet" if visualization_id.nil?
        redis_key = redis_api_call_key(username, api_call_type, visualization_id)
        return $users_metadata.ZSCORE(redis_key, 'total').to_i
      end

    end
  end
end

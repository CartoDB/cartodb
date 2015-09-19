# encoding: UTF-8

require_relative '../../../lib/resque/user_jobs'

module CartoDB
  module Geocoder
    class MailNotifier

      MIN_GEOCODER_TIME_TO_NOTIFY = 3 * 60 # seconds

      def initialize(user, state, table_name, error_code, processable_rows, number_geocoded_rows, geocoding_time)
        @user = user
        @state = state
        @table_name = table_name
        @error_code = error_code
        @processable_rows = processable_rows
        @number_geocoded_rows = number_geocoded_rows
        @geocoding_time = geocoding_time
        @resque = ::Resque
        @mail_sent = false
      end

      def notify_if_needed
        send! if should_notify?
      end

      def should_notify?
        @user.is_subscribed_to?(Carto::UserNotification::GEOCODING_NOTIFICATION) && @geocoding_time >= MIN_GEOCODER_TIME_TO_NOTIFY
      end

      def send!
        @mail_sent = @resque.enqueue(
          ::Resque::UserJobs::Mail::GeocoderFinished,
          @user.id,
          @state,
          @table_name,
          @error_code,
          @processable_rows,
          @number_geocoded_rows
        )
      end

      def mail_sent?
        return @mail_sent
      end

    end

  end #Importer2
end #CartoDB


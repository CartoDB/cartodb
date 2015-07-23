# encoding: UTF-8

require_relative '../../../../lib/resque/user_jobs'
require_relative '../../../../app/models/carto/notification'

module CartoDB
  module Importer2

    class MailNotifier

      MIN_IMPORT_TIME_TO_NOTIFY = 3 * 60 # seconds

      def initialize(data_import, user, results, resque)
        @data_import = data_import
        @user = user
        @results = results
        @resque = resque
        @mail_sent = false
      end

      def notify_if_needed
        send! if should_notify?
      end

      def should_notify?
        import_time >= MIN_IMPORT_TIME_TO_NOTIFY && @data_import.synchronization_id.nil?
      end

      def import_time
        @data_import.updated_at - @data_import.created_at
      end

      def send!
        imported_tables = @results.select {|r| r.success }.length
        total_tables = @results.length
        first_imported_table = imported_tables == 0 ? nil : @results.select {|r| r.success }.first
        first_table = @results.first
        errors = imported_tables == total_tables ? nil : @data_import.get_error_text
        if @user.is_subscribed_to?(Carto::Notification::DATA_IMPORT_FINISHED_NOTIFICATION)
          @mail_sent = @resque.enqueue(::Resque::UserJobs::Mail::DataImportFinished, @user.id, imported_tables, total_tables, first_imported_table, first_table, errors)
        end
      end

      def mail_sent?
        return @mail_sent
      end

    end

  end
end


# encoding: UTF-8

require_relative '../../../../lib/resque/user_jobs'

module CartoDB
  module Importer2

    class MailNotifier

      MIN_IMPORT_TIME_TO_NOTIFY = 10 # seconds

      def initialize(data_import, results, resque)
        @data_import = data_import
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
        user_id = @data_import.user_id
        imported_tables = @results.select {|r| r.success }.length
        total_tables = @results.length
        first_table = imported_tables == 0 ? nil : @results.select {|r| r.success }.first
        @mail_sent = @resque.enqueue(::Resque::UserJobs::Mail::DataImportFinished, user_id, imported_tables, total_tables, first_table)
      end

      def mail_sent?
        return @mail_sent
      end

    end

  end #Importer2
end #CartoDB


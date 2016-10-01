# encoding: UTF-8

require_relative '../../../../lib/resque/user_jobs'

module CartoDB
  module Importer2
    class MailNotifier
      MIN_IMPORT_TIME_TO_NOTIFY = 3 * 60 # seconds

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
        filenames = extract_file_names(@data_import)
        imported_tables = @results.select {|r| r.success }.length
        total_tables = @results.length
        first_imported_table = imported_tables == 0 ? nil : @results.select {|r| r.success }.first
        first_table = @results.first
        errors = imported_tables == total_tables ? nil : @data_import.get_error_text
        @mail_sent = @resque.enqueue(::Resque::UserJobs::Mail::DataImportFinished,
                                     user_id, imported_tables, total_tables, first_imported_table,
                                     first_table, errors, filenames)
      end

      def extract_file_names(data_import)
        files = []

        begin
          file_stats = JSON.parse(data_import.stats)
        rescue JSON::ParserError
          file_stats = []
        end

        if !file_stats.empty?
          file_stats.each do |file_data|
            files << file_data['filename']
          end
        else
          # This case happens before process the files when there
          # is no file stats
          if !data_import.service_item_id.blank?
            # Imports from files, URLs or connectors have a service_item_id
            files << File.basename(data_import.service_item_id)
          elsif !data_import.table_name.blank?
            # Imports from queries or table duplications use table_name
            files << File.basename(data_import.table_name)
          end
        end

        files
      end

      def mail_sent?
        return @mail_sent
      end
    end
  end
end


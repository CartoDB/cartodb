require 'uri'
require 'json'

module Carto
  module Api
    class DataImportPresenter

      def initialize(data_import)
        @data_import = data_import
      end

      def api_public_values
        public_values.reject { |key|
          NON_API_VISIBLE_ATTRIBUTES.include?(key)
        }
      end

      private

      PUBLIC_ATTRIBUTES = [
        'id',
        'user_id',
        'table_id',
        'data_type',
        'table_name',
        'state',
        'error_code',
        'queue_id',
        'tables_created_count',
        'synchronization_id',
        'service_name',
        'service_item_id',
        'type_guessing',
        'quoted_fields_guessing',
        'content_guessing',
        'server',
        'host',
        'upload_host',
        'resque_ppid',
        'create_visualization',
        'visualization_id',
        # String field containing a json, format:
        # {
        #   twitter_credits: Integer
        # }
        # No automatic conversion coded
        'user_defined_limits'
      ]

      NON_API_VISIBLE_ATTRIBUTES = [
        'service_item_id',
        'service_name',
        'server',
        'host',
        'upload_host',
        'resque_ppid',
      ]

      def public_values
        values = Hash[PUBLIC_ATTRIBUTES.map{ |attribute| [attribute, @data_import.send(attribute)] }]
        values.merge!('get_error_text' => get_error_text)
        values.merge!('display_name' => display_name)
        values.merge!('queue_id' => @data_import.id)
        values.merge!(success: @data_import.success) if @data_import.final_state?
        values
      end

      def get_error_text
        if @data_import.error_code.nil?
          nil
        else
          @data_import.error_code.blank? ? CartoDB::IMPORTER_ERROR_CODES[99999] : CartoDB::IMPORTER_ERROR_CODES[@data_import.error_code]
        end
      end

      def display_name
        if @data_import.service_name == 'twitter_search'
          extract_twitter_display_name(@data_import)
        else
          url = [@data_import.data_source, @data_import.service_item_id].compact.select { |s| s != '' }.first
          display_name = url.nil? ? @data_import.id : extract_filename(url)
          display_name || @data_import.id
        end
      rescue => e
        CartoDB.notify_debug('Error extracting display name', { data_import_id: @data_import.id, service_item_id: @data_import.service_item_id, data_source: @data_import.data_source })
        @data_import.id
      end

      def extract_filename(url)
        URI.decode(File.basename(URI.parse(URI.encode(url.strip)).path))
      end

      def extract_twitter_display_name(data_import)
        "Tweets about '#{JSON.parse(data_import.service_item_id)['categories'].map { |c| c['terms'] }.join(', ')}'"
      rescue => e
        CartoDB.notify_debug('Error extracting Twitter import display name', { data_import_id: data_import.id, service_item_id: data_import.service_item_id, data_source: data_import.data_source })
        "Twitter search #{data_import.id}"
      end

    end
  end
end

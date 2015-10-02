require 'uri'
require 'json'

module Carto
  module Api
    class DataImportPresenter

      HTTP_RESPONSE_CODE_MESSAGES = {
        "300" => "The file has been moved! Click on the link to get its new location.",
        "301" => "The file has been moved! Click on the link to get its new location.",
        "302" => "The file has been temporally moved! Click on the link to get its new location.",
        "303" => "The file has been moved! Click on the link to get its new location.",
        "307" => "The file has been temporally moved! Click on the link to get its new location.",
        "400" => "CartoDB did not perform the request properly.",
        "401" => "CartoDB is not authorized to retrieve this file. If you have authorization, " \
                  "download the file manually and upload it from your computer.",
        "402" => "CartoDB is not authorized to retrieve this file. If you have authorization, " \
                  "download the file manually and upload it from your computer.",
        "403" => "CartoDB is not authorized to retrieve this file. If you have authorization, " \
                  "download the file manually and upload it from your computer.",
        "404" => "No file was found at the specified URL. Please review the URL provided.",
        "405" => "CartoDB could not negotiate the download with the file's provider. The provider is probably " \
        "using a non standard method to serve this file.",
        "407" => "CartoDB is not authorized to retrieve this file as proxy authentication is required. If you " \
                  "can use the apropiate proxy, download the file manually and upload it from your computer.",
        "408" => "A timeout request was produced. You may want to try again.",
        "409" => "A confilict in the request was produced. You might want to try again.",
        "410" => "The file specified is now longer available at this location.",
        "411" => "CartoDB did not perform the request properly. 'Content Length' header is missing.",
        "412" => "CartoDB could not negotiate the download with the file's provider. The provider is probably using " \
                  "a non standard method to serve this file.",
        "413" => "The file provider is denying the download because the file is too large.",
        "417" => "CartoDB could not negotiate the download with the file's provider. The provider is probably using " \
                  "a non standard method to serve this file.",
        "500" => "The file provider responded with an internal server error. They might be overloaded or having " \
                  "some down time. Try again later!",
        "501" => "CartoDB could not negotiate the download with the file's provider. The provider is probably using " \
                  "a non standard method to serve this file.",
        "502" => "The file provider responded with a bad gateway error.",
        "503" => "The file provider responded with an internal server error. They might be overloaded or having " \
                  "some down time. Try again later!",
        "504" => "Gateway Timeout The server was acting as a gateway or proxy and did not receive a timely " \
                  "response from the upstream server",
        "505" => "The file provider doesn't seem to support the HTTP version used in the transaction. The provider " \
                  "is probably using a non standard method to serve this file.",
        "511" => "CartoDB is not authorized to retrieve this file. If you have authorization, download the file " \
                  "manually and upload it from your computer." }


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
        values.merge!(original_url: @data_import.original_url)
        values.merge!(data_type: @data_import.data_type)
        values.merge!(http_response_code: @data_import.http_response_code)
        values.merge!(http_response_code_message: get_http_response_code_message(@data_import.http_response_code))
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

      def get_http_response_code_message(http_response_code)
        return nil if http_response_code.nil?

        message = HTTP_RESPONSE_CODE_MESSAGES[http_response_code]

        if message.nil?
          message = case http_response_code
            when /^3/ then "An unknown redirection message was produced."
            when /^4/ then "An unknown client error message was produced."
            when /^5/ then "An unknown server error message was produced."
            else "An unkown type of HTTP status code (#{http_response_code}) was returned."
          end
        end

        message
      end

    end
  end
end

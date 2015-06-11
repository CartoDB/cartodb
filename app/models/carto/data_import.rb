# encoding: UTF-8

require 'active_record'

module Carto
  class DataImport < ActiveRecord::Base

    # INFO: hack to workaround `ActiveRecord::DangerousAttributeError: logger is defined by ActiveRecord`
    class << self
      def instance_method_already_implemented?(method_name)
        return true if method_name == 'logger'
        super
      end
    end

    STATE_ENQUEUED  = 'enqueued'  # Default state for imports whose files are not yet at "import source"
    STATE_PENDING   = 'pending'   # Default state for files already at "import source" (e.g. S3 bucket)
    STATE_UNPACKING = 'unpacking'
    STATE_IMPORTING = 'importing'
    STATE_COMPLETE  = 'complete'
    STATE_UPLOADING = 'uploading'
    STATE_FAILURE   = 'failure'
    STATE_STUCK     = 'stuck'

    belongs_to :user

    # Meant to be used when calling from API endpoints (hides some fields not needed at editor scope)
    def api_public_values
      public_values.reject { |key|
        NON_API_VISIBLE_ATTRIBUTES.include?(key)
      }
    end

    def is_raster?
      ::JSON.parse(self.stats).select{ |item| item['type'] == '.tif' }.length > 0
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
      'get_error_text',
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
      values = Hash[PUBLIC_ATTRIBUTES.map{ |attribute| [attribute, send(attribute)] }]
      values.merge!('queue_id' => id)
      values.merge!(success: success) if (state == STATE_COMPLETE || state == STATE_FAILURE || state == STATE_STUCK)
      values
    end

    def get_error_text
      if self.error_code.nil?
        nil
      else
        self.error_code.blank? ? CartoDB::IMPORTER_ERROR_CODES[99999] : CartoDB::IMPORTER_ERROR_CODES[self.error_code]
      end
    end

  end
end

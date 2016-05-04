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
    STATE_CANCELLED = 'cancelled'

    belongs_to :user, class_name: Carto::User
    belongs_to :log, class_name: Carto::Log
    has_many :external_data_imports, inverse_of: :data_import, class_name: Carto::ExternalDataImport
    has_many :user_tables, class_name: Carto::UserTable

    def is_raster?
      ::JSON.parse(self.stats).select{ |item| item['type'] == '.tif' }.length > 0
    end

    def final_state?
      [STATE_COMPLETE, STATE_FAILURE, STATE_STUCK].include? state
    end

    private

  end
end

require 'active_record'

module Carto
  class DataImport < ActiveRecord::Base

    include Carto::DataImportConstants

    # INFO: hack to workaround `ActiveRecord::DangerousAttributeError: logger is defined by ActiveRecord`
    class << self

      def instance_method_already_implemented?(method_name)
        return true if method_name == 'logger'

        super
      end

    end

    STATE_ENQUEUED  = 'enqueued'.freeze  # Default state for imports whose files are not yet at "import source"
    STATE_PENDING   = 'pending'.freeze   # Default state for files already at "import source" (e.g. S3 bucket)
    STATE_UNPACKING = 'unpacking'.freeze
    STATE_IMPORTING = 'importing'.freeze
    STATE_COMPLETE  = 'complete'.freeze
    STATE_UPLOADING = 'uploading'.freeze
    STATE_FAILURE   = 'failure'.freeze
    STATE_STUCK     = 'stuck'.freeze

    belongs_to :user, class_name: Carto::User
    belongs_to :log, class_name: Carto::Log, foreign_key: :logger
    has_many :external_data_imports, inverse_of: :data_import, class_name: Carto::ExternalDataImport
    has_many :user_tables, class_name: Carto::UserTable

    validate :validate_collision_strategy

    def is_raster?
      ::JSON.parse(stats).select { |item| item['type'] == '.tif' }.length > 0
    end

    def final_state?
      [STATE_COMPLETE, STATE_FAILURE, STATE_STUCK].include?(state)
    end

  end
end

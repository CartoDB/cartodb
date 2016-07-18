# encoding: UTF-8

require 'active_record'

module Carto
  class UserMigrationExport < ::ActiveRecord::Base
    belongs_to :organization, class_name: Carto::Organization
    belongs_to :user, class_name: Carto::User
    belongs_to :log, class_name: Carto::Log

    STATE_PENDING = 'pending'.freeze
    STATE_EXPORTING = 'exporting'.freeze
    STATE_UPLOADING = 'uploading'.freeze
    STATE_COMPLETE = 'complete'.freeze
    STATE_FAILURE = 'failure'.freeze
    VALID_STATES = [STATE_PENDING, STATE_EXPORTING, STATE_UPLOADING, STATE_COMPLETE, STATE_FAILURE].freeze

    validates :state, inclusion: { in: VALID_STATES }
  end
end

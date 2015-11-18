require 'active_record'

module Carto
  class BiDataset < ActiveRecord::Base

    belongs_to :user, class_name: Carto::User

    VALID_STATES = ['pending', 'importing', 'ready', 'error']
    validate :state, inclusion: { in: VALID_STATES, :allow_nil => false }

    def import_config_json
      JSON.parse(import_config)
    end

    def import_credentials_json
      JSON.parse(import_credentials)
    end
  end
end

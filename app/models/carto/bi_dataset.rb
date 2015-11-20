require 'active_record'

module Carto
  class BiDataset < ActiveRecord::Base

    belongs_to :user, class_name: Carto::User

    has_many :bi_visualizations, class_name: Carto::BiVisualization, dependent: :destroy

    VALID_STATES = ['pending', 'importing', 'ready', 'error']
    validate :state, inclusion: { in: VALID_STATES, allow_nil: false }

    def import_config_json
      JSON.parse(import_config).symbolize_keys
    end

    def import_credentials_json
      JSON.parse(import_credentials).symbolize_keys
    end

    def accessible_by?(user)
      user && user_id == user.id
    end

  end
end

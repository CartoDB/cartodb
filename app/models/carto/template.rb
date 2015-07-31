# encoding: UTF-8

require 'active_record'

module Carto
  class Template < ActiveRecord::Base

    # INFO: On delete org will wipe out all templates
    belongs_to :organization
    # INFO: On delete of source visualization will wipe out all templates
    belongs_to :visualization, primary_key: :source_visualization_id
    has_many :required_tables, through: :user_table

    validates :organization_id, presence: true
    validates :source_visualization_id, presence: true
    validates :title, presence: true
    validates :min_supported_version, presence: true
    validates :max_supported_version, presence: true

  end
end
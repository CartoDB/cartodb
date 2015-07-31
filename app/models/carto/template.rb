# encoding: UTF-8

require 'active_record'

module Carto
  class Template < ActiveRecord::Base

    # INFO: On delete org will wipe out all templates
    belongs_to :organization
    # INFO: On delete of source visualization will wipe out all templates
    belongs_to :visualization, primary_key: :source_visualization_id

    validates :organization_id, presence: true
    validates :source_visualization_id, presence: true
    validates :title, presence: true
    validates :min_supported_version, presence: true
    validates :max_supported_version, presence: true
    validate :required_tables_should_be_qualified

    before_validation :ensure_required_tables_not_empty

    def ==(other_template)
      self.id == other_template.id
    end

    private

    def required_tables_should_be_qualified
      wrong_table_names = self.required_tables.select { |table_name|
          (table_name =~ /^[a-z\-_0-9]+\.[a-z\-_0-9]+?$/i) != 0
        }
      if wrong_table_names.length > 0
        errors.add(:required_tables, "must be fully qualified table names")
      end
    end

    def ensure_required_tables_not_empty
      if self.required_tables.nil?
        self.required_tables = []
      end
    end

  end
end
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

    validate :source_visualization_referential_integrity
    validate :required_tables_should_be_qualified
    validate :required_tables_referential_integrity

    # INFO: Needed as rails 3 + activerecord-postgres-array gem is still buggy
    def required_tables
      self.required_tables_list.split(',')
    end

    # INFO: Needed as rails 3 + activerecord-postgres-array gem is still buggy
    def required_tables=(list=[])
      self.required_tables_list = list.join(',')
    end

    def relates_to_table?(table)
      required_tables.include?(table.qualified_table_name.gsub('"',''))
    end

    private

    def source_visualization_referential_integrity
      return if errors.keys.include?(:source_visualization_id)

      visualization = Carto::Visualization.where(id: self.source_visualization_id).first
      errors.add(:source_visualization_id, "Source visualization not found") if visualization.nil?

      if visualization.user.organization_id != self.organization_id
        errors.add(:source_visualization_id, "Source visualization not found")
      end
    end

    def required_tables_should_be_qualified
      wrong_table_names = required_tables.select { |table_name|
          !::Table.is_qualified_name_valid?(table_name)
        }
      errors.add(:required_tables, "Invalid names: #{wrong_table_names.join(', ')}") if wrong_table_names.length > 0
    end

    def required_tables_referential_integrity
      # If already have invalid names, don't run this validation
      return if errors.keys.include?(:required_tables)

      wrong_tables = required_tables.select { |qualified_name|
          schema, table_name = qualified_name.split('.')
          begin
            user = Carto::User.where({ database_schema: schema, organization_id: self.organization_id}).first
            Carto::VisualizationQueryBuilder.new
                                            .with_name(table_name)
                                            .with_user_id(user.id)
                                            .count == 0
          rescue StandardError
            true
          end
        }

      errors.add(:required_tables, "Invalid tables: #{wrong_tables.join(', ')}") if wrong_tables.length > 0
    end

  end
end

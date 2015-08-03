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
    validate :required_tables_referential_integrity

    def ==(other_template)
      self.id == other_template.id
    end

    def required_tables
      self.required_tables_list.split(',')
    end

    def required_tables=(list=[])
      self.required_tables_list = list.join(',')
    end

    # INFO: Only checks regarding user tables, not organization ones
    def relates_to?(visualization)
      @users_cache = []
      visualization.related_tables.each do |table|
        # TODO: Remove this when solving https://github.com/CartoDB/cartodb/issues/4838
        # HACK: Layer models return different instances
        if table.class == Carto::UserTable
          table_name = "#{table.user.database_schema}.#{table.name}"
        else
          table_name = "#{table.owner.database_schema}.#{table.name}"
        end
        return true  if required_tables.include?(table_name)
      end
      
      false
    ensure
      @users_cache = []
    end

    private

    def required_tables_should_be_qualified
      wrong_table_names = required_tables.select { |table_name|
          (table_name =~ /^[a-z\-_0-9]+\.[a-z\-_0-9]+?$/) != 0
        }
      errors.add(:required_tables, "Invalid names: #{wrong_tables.join(', ')}") if wrong_table_names.length > 0
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
                                            .build
                                            .count == 0
          rescue
            true
          end
        }
      
      errors.add(:required_tables, "Invalid tables: #{wrong_tables.join(', ')}") if wrong_tables.length > 0
    end

  end
end
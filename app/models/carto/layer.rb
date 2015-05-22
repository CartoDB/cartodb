require 'active_record'

module Carto
  class Layer < ActiveRecord::Base
    serialize :options, JSON
    serialize :infowindow, JSON
    serialize :tooltip, JSON

    has_and_belongs_to_many :maps, class_name: Carto::Map

    has_many :layers_user
    has_many :users, :through => :layers_user

    has_many :children, class_name: Carto::Layer, foreign_key: :parent_id

    def affected_tables
      (tables_from_query_option + tables_from_table_name_option).compact.uniq
    end

    def legend
      @legend ||= options['legend']
    end

    def qualified_table_name(viewer_user)
      "#{viewer_user.sql_safe_database_schema}.#{options['table_name']}"
    end

    private

    def tables_from_query_option
      ::Table.get_all_user_tables_by_names(affected_table_names, user)
    end

    def affected_table_names
      return [] unless query.present?

      # TODO: This is the same that CartoDB::SqlParser().affected_tables does. Maybe remove that class?
      query_tables = user.in_database.execute("SELECT CDB_QueryTables(#{user.in_database.quote(query)})").first
      query_tables['cdb_querytables'].split(',').map do |table_name|
        t = table_name.gsub!(/[\{\}]/, '')
        (t.blank? ? nil : t)
      end.compact.uniq
    end

    def tables_from_table_name_option
      return[] if options.empty?
      ::Table.get_all_user_tables_by_names([options.symbolize_keys[:table_name]], user)
    end

    def query
      options.symbolize_keys[:query]
    end

    def user
      @user ||= maps.first.user
    end
  end
end

require 'active_record'

class Carto::Layer < ActiveRecord::Base
  serialize :options, JSON

  has_and_belongs_to_many :maps, class_name: Carto::Map

  has_many :children, class_name: Carto::Layer, foreign_key: :parent_id

  def affected_tables
    (tables_from_query_option + tables_from_table_name_option).compact.uniq
  end

  def legend
    @legend ||= options['legend']
  end

  private

  def tables_from_query_option
    ::Table.get_all_by_names(affected_table_names, user)
  end

  def affected_table_names
    return [] unless query.present?
    CartoDB::SqlParser.new(query, connection: user.in_database).affected_tables
  end

  def tables_from_table_name_option
    return[] if options.empty?
    ::Table.get_all_by_names([options.symbolize_keys[:table_name]], user)
  end

  def query
    options.symbolize_keys[:query]
  end

  def user
    @user ||= maps.first.user
  end
end

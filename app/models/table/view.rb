# encoding: utf-8

class View
  attr_reader :database_name, :database_schema, :name, :relkind

  def initialize(database_name:, database_schema:, name:, relkind:)
    @database_name = database_name
    @database_schema = database_schema
    @name = name
    @relkind = relkind
  end

  def materialized_view?
    @relkind == 'm'
  end

  def ==(other)
    @database_name == other.database_name &&
      @database_schema == other.database_schema &&
      @name == other.name
  end
end

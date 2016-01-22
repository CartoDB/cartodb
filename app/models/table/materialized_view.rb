# encoding: utf-8

class MaterializedView
  attr_reader :database_name, :database_schema, :name

  def initialize(database_name:, database_schema:, name:)
    @database_name = database_name
    @database_schema = database_schema
    @name = name
  end

  def ==(other)
    @database_name == other.database_name &&
      @database_schema == other.database_schema &&
      @name == other.name
  end
end

module Carto
  module Db
    class Trigger
      attr_reader :database_name, :database_schema, :table_name, :trigger_name

      def initialize(database_name:, database_schema:, table_name:, trigger_name:)
        @database_name = database_name
        @database_schema = database_schema
        @table_name = table_name
        @trigger_name = trigger_name
      end

      def ==(other)
        @database_name == other.database_name &&
          @database_schema == other.database_schema &&
          @table_name == other.table_name &&
          @trigger_name == other.trigger_name
      end
    end
  end
end

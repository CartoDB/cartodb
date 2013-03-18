# encoding: utf-8
require_relative '../../../../../config/initializers/string'

module CartoDB
  class ColumnSanitizer
    def initialize(db, table_name)
      @db         = db
      @table_name = table_name
    end #initialize

    def run
      column_names.each { |column_name| sanitize(column_name) }
    end #run

    private

    attr_reader :db, :table_name

    def column_names
      db.schema(table_name).map{ |s| s[0].to_s }
    end #column_name

    def sanitize(column_name)
      db.run(%Q{
        ALTER TABLE #{table_name} 
        RENAME COLUMN "#{column_name}"
        TO "#{column_name.sanitize_column_name}"
      }) if column_name != column_name.sanitize_column_name
    end #sanitize
  end # ColumnSanitizer
end # CartoDB


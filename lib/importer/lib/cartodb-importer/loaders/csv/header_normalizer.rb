# encoding: utf-8
require 'csv'
require 'fileutils'

module CartoDB
  module CSV
    class HeaderNormalizer
      FILLER = "header"

      def initialize(path, options={})
        @path     = path
        @options  = default_csv_options.merge(options)
      end #initialize

      def run
        temporary_path  = "#{path}_temp_#{Time.now.to_f}"
        input           = File.open(path, 'r')
        output          = File.open(temporary_path, 'w')

        ::CSV.filter(input, output, options) do |row|
          fill_empty_fields_in(row) if row.header_row?
        end

        input.close
        output.close
        FileUtils.mv(temporary_path, path)
      rescue ArgumentError
      end #normalize_csv_header

      def remove_empty_filler_columns_in(db, table)
        filler_columns_in(db, table).each do |column|
          remove(db, table, column) if empty_column?(db, table, column)
        end
      end #clean_empty_columns_in

      private

      attr_reader :path, :options

      def remove(db, table, column)
        db.run(%Q{ ALTER TABLE #{table} DROP COLUMN #{column} })
      end #remove

      def empty_column?(db, table, column)
        db[table.to_sym].where("#{column} IS NOT NULL").count <= 0
      end #no_data_in?

      def filler_columns_in(db, table_name)
        db[table_name.to_sym].columns.select do |column_name|
          column_name.match Regexp.new(FILLER)
        end
      end #filler_columns_in

      def fill_empty_fields_in(row)
        row.inject(Array.new) do |massaged_row, cell| 
          filler  = "#{FILLER}_#{Time.now.to_f}".delete('.')
          cell[-1] = filler unless cell.last
          massaged_row.push(cell)
        end
      end #fill_empty_fields_in

      def default_csv_options
        { 
          headers:        true,
          write_headers:  true,
          return_headers: true
        }
      end #default_csv_options
    end # HeaderNormalizer
  end # CSV
end # CartoDB


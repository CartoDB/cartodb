# encoding: utf-8
require 'csv'
require 'fileutils'

module CartoDB
  module CSV
    class HeaderNormalizer
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

      private

      attr_reader :path, :options

      def fill_empty_fields_in(row)
        row.inject(Array.new) do |massaged_row, cell| 
          filler  = "header_#{Time.now.to_f}".delete('.')
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


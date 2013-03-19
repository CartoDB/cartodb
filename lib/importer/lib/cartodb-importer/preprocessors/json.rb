# encoding: utf-8
require_relative '../utils/encoding_converter'

module CartoDB
  class JSON
    def initialize(arguments={})
      @data_import    = arguments.fetch(:data_import)
      @path           = arguments.fetch(:path)
      @working_data   = arguments.fetch(:working_data)
      @import_data    = Array.new
    end #initialize

    def process!
      EncodingConverter.new(path).run
      json_data = parse_json

      # Skip geojson and complex json structures
      return false if json_data.first.is_a?(Array)

      csv_header = json_data.first.keys.join(',')
      csv_data   = json_data.map { |row| 
        row.values.map { |value| value.gsub(/"/, "\"") }.join(',')
      }.join("\n")

      working_data[:path] = path
      import_data << {
        import_type:      '.json',
        suggested_name:   working_data[:suggested_name],
        ext:              File.extname(working_data[:path]),
        path:             csv_path
      }

      File.open(import_data.first[:path], 'w') do |file|
        file.write [csv_header, csv_data].join("\n")
      end

      import_data
    end

    private

    attr_accessor :data_import, :path, :working_data, :import_data

    def parse_json
      raw_data = File.open(working_data[:path]).read.force_encoding('UTF-8')
      ::JSON.parse(raw_data)
    rescue ::JSON::ParserError => exception
      return false
    end #parse_json

    def csv_path
      File.expand_path(
        File.basename(working_data[:path], File.extname(working_data[:path]))
      ) + ".csv"
    end #csv_path
  end # JSON
end # CartoDB


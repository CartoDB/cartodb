module CartoDB
  module Import
    class JSON < CartoDB::Import::Preprocessor

      register_preprocessor :json

      def process!
        @data_import = DataImport.find(:id => @data_import_id)
        fix_encoding

        import_data = []

        begin
          json_data = ::JSON.parse(File.open(@working_data[:path]).read)
        rescue ::JSON::ParserError => e
          # Ignore file, fall back to loader
          return false
        end

        # Skip geojson and complex json structures
        return false if json_data.first.is_a?(Array)

        csv_header = json_data.first.keys.join(',')
        csv_data   = json_data.map{|row| row.values.map{|value| value.gsub(/"/, "\"")}.join(',')}.join("\n")

        @working_data[:path] = @path
        import_data << {
          :ext => File.extname(@working_data[:path]),
          :import_type => '.json',
          :suggested_name => @working_data[:suggested_name],
          :path => "#{File.expand_path(File.basename(@working_data[:path], File.extname(@working_data[:path])))}.csv"
        }

        File.open(import_data.first[:path], 'w') do |file|
          file.write [csv_header, csv_data].join("\n")
        end

        import_data
      end
    end
  end
end

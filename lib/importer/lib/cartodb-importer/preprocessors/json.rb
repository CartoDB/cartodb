module CartoDB
  module Import
    class JSON < CartoDB::Import::Preprocessor

      register_preprocessor :json

      def process!

        import_data = []
        json_data  = ::JSON.parse(File.open(@working_data[:path]).read)
        csv_header = json_data.first.keys.join(',')
        csv_data   = json_data.map{|row| row.values.map{|value| value.gsub(/"/, "\"")}.join(',')}.join("\n")

        @working_data[:path] =
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

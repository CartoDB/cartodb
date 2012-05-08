module CartoDB
  module Import
    class Exxxxppp < CartoDB::Import::Loader

      register_loader :exxxxppp

      def process!
        ogr2ogr_bin_path = `which ogr2ogr`.strip
        ogr2ogr_command = %Q{#{ogr2ogr_bin_path} -f "PostgreSQL" PG:"host=#{@db_configuration[:host]} port=#{@db_configuration[:port]} user=#{@db_configuration[:username]} dbname=#{@db_configuration[:database]}" #{@path} -nln #{@suggested_name}}

        if $?.exitstatus != 0
          raise "failed to import data to postgres"
        end

        if 0 < out.strip.length
          @runlog.stdout << out
        end

        # Check if the file had data, if not rise an error because probably something went wrong
        if @db_connection["SELECT * from #{@suggested_name} LIMIT 1"].first.nil?
          @runlog.err << "Empty table"
          raise "Empty table"
        end

        # Sanitize column names where needed
        column_names = @db_connection.schema(@suggested_name).map{ |s| s[0].to_s }
        need_sanitizing = column_names.each do |column_name|
          if column_name != column_name.sanitize_column_name
            @db_connection.run("ALTER TABLE #{@suggested_name} RENAME COLUMN \"#{column_name}\" TO #{column_name.sanitize_column_name}")
          end
        end

        @table_created = true
        FileUtils.rm_rf(Dir.glob(@path))
        rows_imported = @db_connection["SELECT count(*) as count from #{@suggested_name}"].first[:count]

        payload = OpenStruct.new({
                                  :name => @suggested_name,
                                  :rows_imported => rows_imported,
                                  :import_type => @import_type,
                                  :log => @runlog
                                })

        # construct return variables
        [to_import_hash, payload]
      end
    end
  end
end
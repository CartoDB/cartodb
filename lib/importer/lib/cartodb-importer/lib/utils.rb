# coding: utf-8

module CartoDB
  module Import
    module Util
      def temporary_filename(prefix="")
        tf = Tempfile.new(prefix)
        tempname = tf.path
        tf.close!
        return tempname
      end

      # datatype that is passed around
      def to_import_hash
        {
          :import_from_file => @import_from_file,
          :db_configuration => @db_configuration,
          :db_connection    => @db_connection,
          :append_to_table  => @append_to_table,
          :force_name       => @force_name,
          :suggested_name   => @suggested_name,
          :ext              => @ext,
          :path             => @data_path || @path,
          :working_data     => @working_data,
          :suggested_names  => @suggested_names,
          :exts             => @exts,
          :paths            => @paths,
          :python_bin_path  => @python_bin_path,
          :psql_bin_path    => @psql_bin_path,
          :entries          => @entries,
          :table_entries    => @table_entries,
          :runlog           => @runlog,
          :import_type      => @import_type,
          :data_import_id   => @data_import_id
        }
      end

      # updates instance variables with return values from decompressors, preprocessors and loaders
      def update_self obj
        obj.each do |k,v|
          instance_variable_set("@#{k}", v) if v
        end
      end

      def get_valid_name(name)
        Table.get_valid_table_name(name, connection: @db_connection)
      end

      def fix_encoding
        begin
          encoding_to_try = "UTF-8"
          is_utf = if `uname` =~ /Darwin/
                     `file -bI #{@path}`
                   else
                     `file -bi #{@path}`
                   end
          unless is_utf.include? 'utf-8'
            # sample first 500 lines from source
            # text/plain; charset=iso-8859-1
            charset = nil
            charset_data = is_utf.split('harset=')

            if 1<charset_data.length
              charset = charset_data[1].split(';')[0].strip
              if charset == ""
                charset = nil
              end
            end

            # Read in a 128kb chunk and try to detect encoding
            chunk = File.open(@path).read(128000)
            cd = CharDet.detect(chunk)
            #puts "*** Chardet detected #{cd.encoding} with #{cd.confidence} confidence"

            # Only do non-UTF8 if we're quite sure. (May fail)
            if !['utf-8', 'ascii', ''].include?(cd.encoding.to_s.downcase) && cd.confidence > 0.6
              tf = Tempfile.new(@path)

              # Try transliteration first, then ignore
              `iconv -f #{cd.encoding} -t UTF-8//TRANSLIT #{@path} > #{tf.path}`
              `iconv -f #{cd.encoding} -t UTF-8//IGNORE #{@path} > #{tf.path}` if $?.exitstatus != 0

              # Overwrite the file only on successful conversion
              `mv -f #{tf.path} #{@path}` if $?.exitstatus == 0
              tf.close!
            elsif !['utf-8'].include?(cd.encoding.to_s.downcase)
              # Fallbacks
              encoding_to_try = if ["", "ascii"].include?(cd.encoding.to_s)
                                  "UTF-8"
                                else
                                  cd.encoding.to_s
                                end
            end
          end

          return encoding_to_try

        rescue => e
          # Silently fail here and try importing anyway
          log "ICONV failed for CSV #{@path}: #{e.message} #{e.backtrace}"
          return "UTF-8"
        end
      end

      def log str
        #puts str # if @@debug
      end

      def reproject_import random_table_name
        @db_connection.run("ALTER TABLE #{random_table_name} RENAME COLUMN the_geom TO the_geom_orig;")
        geom_type_row = @db_connection["SELECT GeometryType(ST_Force_2D(the_geom_orig)) as type from #{random_table_name} WHERE the_geom_orig IS NOT NULL LIMIT 1"].first
        if geom_type_row.nil?
          @db_connection.run("SELECT AddGeometryColumn('#{random_table_name}','the_geom',4326, 'POINT', 2);")
        else
          geom_type = geom_type_row[:type]
          @db_connection.run("SELECT AddGeometryColumn('#{random_table_name}','the_geom',4326, '#{geom_type}', 2);")
          @db_connection.run("UPDATE \"#{random_table_name}\" SET the_geom = ST_Force_2D(ST_Transform(the_geom_orig, 4326)) WHERE the_geom_orig IS NOT NULL")
        end
        @db_connection.run("ALTER TABLE #{random_table_name} DROP COLUMN the_geom_orig")
      end
      # def force_table_2d random_table_name
      #   @db_connection.run("UPDATE \"#{random_table_name}\" SET the_geom = ST_Force_2D(the_geom)")
      # end
      def add_index random_table_name, index_name=nil
        if index_name.nil?
          @db_connection.run("CREATE INDEX \"#{random_table_name}_the_geom_gist\" ON \"#{random_table_name}\" USING GIST (the_geom)")
        else
          @db_connection.run("CREATE INDEX \"#{index_name}_the_geom_gist\" ON \"#{random_table_name}\" USING GIST (the_geom)")
        end
      end
      def drop_index random_index_name
        @db_connection.run("DROP INDEX IF EXISTS \"#{random_index_name}\"")
      end

      def sanitize_table_columns table_name
        # Sanitize column names where needed
        column_names = @db_connection.schema(table_name).map{ |s| s[0].to_s }
        need_sanitizing = column_names.each do |column_name|
          if column_name != column_name.sanitize_column_name
            @db_connection.run("ALTER TABLE #{table_name} RENAME COLUMN \"#{column_name}\" TO #{column_name.sanitize_column_name}")
          end
        end
      end
    end
  end
end

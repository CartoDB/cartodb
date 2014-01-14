# coding: UTF-8

module CartoDB
  class Migrator
    class << self
      attr_accessor :debug
    end
    @@debug = true

    attr_accessor :current_name, :suggested_name, :db_configuration, :db_connection

    attr_reader :table_created, :force_name

    def initialize(options = {})
      # log "options: #{options}"
      @@debug = options[:debug] if options[:debug]
      @table_created = nil

      # Handle name of table and target name of table
      @suggested_name = options[:current_name]
      @current_name = options[:current_name]

      #@data_import      = DataImport.find(:id=>options[:data_import_id])
      #@data_import_id   = options[:data_import_id]

      raise "current_table value can't be nil" if @current_name.nil?

      # Handle DB connection
      @db_configuration = options.slice :database, :username, :password, :host, :port
      @db_configuration = {:port => 5432, :host => '127.0.0.1'}.merge @db_configuration
      @db_connection = Sequel.connect("postgres://#{@db_configuration[:username]}:#{@db_configuration[:password]}@#{@db_configuration[:host]}:#{@db_configuration[:port]}/#{@db_configuration[:database]}")

      #handle suggested_name
      unless options[:suggested_name].nil? || options[:suggested_name].blank?
        @force_name = true
        @suggested_name = options[:suggested_name]
      else
        @force_name = false
      end

    rescue => e
      log $!
      log e.backtrace
      raise e
    end

    def migrate!
      #
      # # Check if the file had data, if not rise an error because probably something went wrong
      # if @db_connection["SELECT * from #{@current_name} LIMIT 1"].first.nil?
      #   @runlog.err << "Empty table"
      #   @data_import.log_error("Empty table")
      #   raise "Empty table"
      # end

      # Sanitize column names where needed
      column_names = @db_connection.schema(@current_name).map{ |s| s[0].to_s }

      sanitize(column_names)

      # Rename our table
      if @current_name != @suggested_name
        @db_connection.run("ALTER TABLE #{@current_name} RENAME TO #{@suggested_name}")
        @current_name = @suggested_name
      end

      #if column_names.include? "cartodb_id"
        ## We could also just alter the column name here, but users shouldn't be bothered with this column at all
        #@db_connection.run("ALTER TABLE #{@current_name} DROP COLUMN cartodb_id")
      #end

      # attempt to transform the_geom to 4326
      if column_names.include? "the_geom"
        begin
          if srid = @db_connection["select st_srid(the_geom) from #{@suggested_name} limit 1"].first
            srid = srid[:st_srid] if srid.is_a?(Hash)
            begin
              if srid.to_s != "4326"
                #@data_import.log << ("Transforming the_geom from #{srid} to 4326")
                # move original geometry column around
                @db_connection.run("UPDATE #{@suggested_name} SET the_geom = ST_Transform(the_geom, 4326);")
                #@db_connection.run("CREATE INDEX #{@suggested_name}_the_geom_gist ON #{@suggested_name} USING GIST (the_geom)")
              end
            rescue => e
              #@data_import.log << ("Failed to transform the_geom from #{srid} to 4326 #{@suggested_name}. #{e.inspect}")
              @runlog.err << "Failed to transform the_geom from #{srid} to 4326 #{@suggested_name}. #{e.inspect}"
            end
          end
        rescue => e
          #@data_import.log << ("Failed to process the_geom renaming to invalid_the_geom. #{e.inspect}")
          # if no SRID or invalid the_geom, we need to remove it from the table
          begin
            @db_connection.run("ALTER TABLE #{@suggested_name} RENAME COLUMN the_geom TO invalid_the_geom")
            column_names.delete("the_geom")
          rescue => exception
          end
        end
      end

      # if there is no the_geom, and there are latitude and longitude columns, create the_geom
      unless column_names.include? "the_geom"

        latitude_possible_names = "'latitude','lat','latitudedecimal','latitud','lati'"
        longitude_possible_names = "'longitude','lon','lng','longitudedecimal','longitud','long'"

        matching_latitude = nil
        res = @db_connection["select column_name from information_schema.columns where table_name ='#{@suggested_name}'
          and lower(column_name) in (#{latitude_possible_names}) LIMIT 1"]
        if !res.first.nil?
          matching_latitude= res.first[:column_name]
        end
        matching_longitude = nil
        res = @db_connection["select column_name from information_schema.columns where table_name ='#{@suggested_name}'
          and lower(column_name) in (#{longitude_possible_names}) LIMIT 1"]
        if !res.first.nil?
          matching_longitude= res.first[:column_name]
        end


        if matching_latitude and matching_longitude
            #@data_import.log << ("converting #{matching_latitude}, #{matching_latitude} to the_geom")
            #we know there is a latitude/longitude columns
            @db_connection.run("SELECT AddGeometryColumn('#{@suggested_name}','the_geom',4326, 'POINT', 2);")

            @db_connection.run(<<-GEOREF
            UPDATE \"#{@suggested_name}\"
            SET the_geom =
              ST_GeomFromText(
                'POINT(' || trim(\"#{matching_longitude}\") || ' ' || trim(\"#{matching_latitude}\") || ')', 4326
            )
            WHERE
            trim(CAST(\"#{matching_longitude}\" AS text)) ~ '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
            AND
            trim(CAST(\"#{matching_latitude}\" AS text))  ~ '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
            GEOREF
            )
            #@db_connection.run("CREATE INDEX \"#{@suggested_name}_the_geom_gist\" ON \"#{@suggested_name}\" USING GIST (the_geom)")
        end
      end

      @table_created = true
      #@data_import.log << ("table created")
      rows_imported = @db_connection["SELECT count(*) as count from #{@suggested_name}"].first[:count]

      payload = OpenStruct.new({
                              :name => @suggested_name,
                              :rows_imported => rows_imported,
                              :import_type => "external_table",
                              :log => @runlog
                              })

      # construct return variables
      return payload

    rescue => e
      log "====================="
      log $!
      log e.backtrace
      log "====================="
      if !@table_created.nil?
        @db_connection.drop_table(@suggested_name)
      end
      raise e
    ensure
      @db_connection.disconnect
    end

    private

    def get_valid_name(name)
      Table.get_valid_table_name(name, 
        name_candidates: @db_connection.tables.map(&:to_s))
    end

    def log(str)
      if @@debug
        puts str
      end
    end

    def sanitize(column_names)
      columns_to_sanitize = column_names.select do |column_name|
        column_name != column_name.sanitize_column_name
      end

      correct_columns = column_names - columns_to_sanitize

      sanitization_map = Hash[
        columns_to_sanitize.map { |column_name|
          [column_name, column_name.sanitize_column_name]
        }
      ]

      sanitization_map = sanitization_map.inject({}) { |memo, pair|
        if memo.values.include?(pair.last) || correct_columns.include?(pair.last)
          memo.merge(pair.first => "#{pair.last}_1")
        else
          memo.merge(pair.first => pair.last)
        end
      }

      sanitization_map.each do |unsanitized, sanitized|
        @db_connection.run(%Q{
          ALTER TABLE #{@current_name}
          RENAME COLUMN "#{unsanitized}"
          TO "#{sanitized}"
        })
      end
    end
  end
end

# encoding: utf-8
require 'open3'
require 'fileutils'
require_relative '../utils/column_sanitizer'
require_relative '../utils/indexer'

module CartoDB
  class OSM
    API_LIMIT_REACHED_REGEX = %r{ou requested too many nodes}
    TYPE_CONVERSIONS        = {
      "line"      => "MULTILINESTRING",
      "polygon"   => "MULTIPOLYGON",
      "roads"     => "MULTILINESTRING",
      "points"    => "POINT"
    }

    def initialize(arguments)
      @data_import        = arguments.fetch(:data_import)
      @entries            = arguments.fetch(:entries)
      @db                 = arguments.fetch(:db)
      @db_configuration   = arguments.fetch(:db_configuration)

      #needs to be 8+2 less than normal names because of _polygon_n
      @suggested_name     = arguments.fetch(:working_data)
                              .fetch(:suggested_name)[0..9]
      @path               = arguments.fetch(:working_data)
                              .fetch(:path)
      @ext                = arguments.fetch(:working_data)
                              .fetch(:ext)
    end #initialize

    def process!
      osm2pgsql_bin_path = `which osm2pgsql`.strip
      host = db_configuration[:host] ? "-H #{db_configuration[:host]}" : ""
      port = db_configuration[:port] ? "-P #{db_configuration[:port]}" : ""

      # TODO Create either a dynamic cache size based on user account type
      # or pick a wiser number for everybody
      allowed_cache_size  = 1024
      random_table_prefix = "importing_#{Time.now.to_i}_#{suggested_name}"

      # I tried running the -G or --multi-geometry option to force multigeometries
      # but the result is always a column with mixed types, polygons and multipolgons!
      full_osm_command = "#{osm2pgsql_bin_path} #{host} #{port} --slim --style #{Rails.root.join('config', 'osm2pgsql.style')} -U #{db_configuration[:username]} -d #{db_configuration[:database]} -u -I -C #{allowed_cache_size} --multi-geometry --latlong -p #{random_table_prefix} #{path}"

      data_import.log_update(full_osm_command)
      stdin,  stdout, stderr = Open3.popen3(full_osm_command)

      wait_until_table_present("#{random_table_prefix}_line")

      if $?.exitstatus != 0
        data_import.set_error_code(6000)
        data_import.log_update(stdout.read)
        data_import.log_error(stderr.read)
        data_import.log_error("ERROR: failed to import #{path}")
        raise "ERROR: failed to import #{path}"
      end

      valid_tables = Array.new
      begin
        ["line", "polygon", "roads", "point"].each  do |feature|
          old_table_name = "#{random_table_prefix}_#{feature}"
          rows_imported = db["SELECT count(*) as count from #{old_table_name}"].first[:count]
          unless rows_imported.nil? || rows_imported == 0
            valid_tables << feature
          else
            db.drop_table old_table_name
          end
        end
      rescue => ex
        data_import.log_update(stdout.read)
        data_import.log_update(stderr.read)
        data_import.log_error("ERROR: failed to import #{path} #{ex}")
        raise "ERROR: failed to import #{path} #{ex}"
      end

      import_tag    = "#{suggested_name}_#{Time.now.to_i}"
      import_tables = Array.new
      payloads      = Array.new
      valid_tables.each do |feature|
        old_table_name = "#{random_table_prefix}_#{feature}"
        table_name     = get_valid_name("#{suggested_name}_#{feature}")

        begin
          rename_table(old_table_name, table_name)
          #@table_created = true
          entries.each{ |entry| FileUtils.rm_rf(entry) } if entries.any?

          osm_geom_name = "way"
          geoms = db["SELECT count(*) as count from #{table_name} LIMIT 10"].first[:count]
          unless geoms.nil? || geoms == 0
            rename_geom_column(table_name, osm_geom_name)
            normalize_geom(feature, table_name) if feature == "polygon"

            CartoDB::Indexer.new(db)
              .add(table_name, "importing_#{Time.now.to_i}_#{table_name}")
          end

          success = CartoDB::ColumnSanitizer.new(db, table_name).run
          unless success
            data_import.log_update("ERROR: Failed to sanitize some column names")
          end

          data_import.save

          payloads << OpenStruct.new(
            name:           table_name,
            rows_imported:  rows_imported_for(table_name),
            import_type:    '.osm',
            log:            ''
          )

          data_import.refresh
        rescue Exception => msg
          #@runlog.err << msg
          data_import.set_error_code(5000)
          data_import.log_error(msg)
          data_import.log_error(%Q{
            ERROR: unable to rename "#{old_table_name}" to "#{table_name}"
          })
          begin
            db.drop_table old_table_name
          rescue
            data_import.log_error(%Q{ERROR: "#{old_table_name}" doesn't exist})
          end
        end
      end

      payloads
    end #process!

    private

    attr_reader :data_import, :entries, :db, :db_configuration, :suggested_name, :path, :ext

    def rename_table(old_name, new_name)
      db.run(%Q{
        ALTER TABLE "#{old_name}"
        RENAME TO "#{new_name}"
      })
    rescue
      raise DatabaseImportError
    end #rename_table

    def rows_imported_for(table_name)
      db["SELECT count(*) as count from #{table_name}"].first[:count]
    end #rows_imported

    def rename_geom_column(table_name, column_name)
      db.run(%Q{
        ALTER TABLE #{table_name}
        RENAME COLUMN "#{column_name}"
        TO the_geom
      })
    rescue
      raise DatabaseImportError
    end #rename_geom_column

    def normalize_geom(type, table_name)
      # because the osm2pgsql importer isn't being complete about multi geom type
      # i use this check, instead of the full geom rebuild used in the table methods
      # to get all geoms to the same type

      db.run(%Q{
        UPDATE #{table_name}
        SET the_geom = ST_Multi(the_geom)
        WHERE geometrytype(the_geom) != '#{TYPE_CONVERSIONS.fetch(type)}'
      })
    end #normalize_geom_type

    def get_valid_name(name)
      ::Table.get_valid_table_name(name, connection: db)
    end #get_valid_name

    def wait_until_table_present(table_name)
      started_at = Time.now
      begin
        db["SELECT count(*) as count from #{table_name}"].first[:count]
      rescue => exception
        if Time.now - started_at < 120
          retry
        else
          raise exception
        end
      end
      sleep 1
    end
  end # OSM
end # CartoDB

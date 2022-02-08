require_relative './ogr2ogr'
require_relative './exceptions'
require_relative './format_linter'
require_relative './csv_normalizer'
require_relative './shp_normalizer'
require_relative './json2csv'
require_relative './xlsx2csv'
require_relative './xls2csv'
require_relative './georeferencer'
require_relative '../importer/post_import_handler'
require_relative './geometry_fixer'
require_relative './typecaster'
require_relative './arcgis_autoguessing'

require_relative '../../../../lib/cartodb/stats/importer'

module CartoDB
  module Importer2
    class Loader

      include ::LoggerHelper

      SCHEMA            = 'cdb_importer'
      TABLE_PREFIX      = 'importer'
      NORMALIZERS       = [FormatLinter, CsvNormalizer, Xls2Csv, Xlsx2Csv, Json2Csv]

      # Files matching any of this regexps will be forcibly normalized
      # @see services/datasources/lib/datasources/search/twitter.rb -> table_name
      FORCE_NORMALIZER_REGEX = [
        /^twitter_(.*)\.csv/
      ]
      DEFAULT_ENCODING  = 'UTF-8'

      def self.supported?(extension)
        !(%w{ .tif .tiff }.include?(extension))
      end

      def initialize(job, source_file, layer = nil, ogr2ogr = nil, georeferencer = nil)
        self.job            = job
        self.source_file    = source_file
        self.layer          = layer
        self.ogr2ogr        = ogr2ogr
        self.georeferencer  = georeferencer
        self.options        = {}
        @post_import_handler = nil
        @importer_stats = CartoDB::Stats::Importer.instance
      end

      def set_importer_stats(importer_stats)
        @importer_stats = importer_stats
      end

      def run(post_import_handler_instance=nil)
        @file_extension = source_file.extension.split('.').last
        @importer_stats.timing('loader') do
          @post_import_handler = post_import_handler_instance

          @importer_stats.timing('normalize') do
            normalize
          end

          job.log "Detected encoding #{encoding}"
          job.log "Using database connection with #{job.concealed_pg_options}"

          @importer_stats.timing('ogr2ogr') do
            run_ogr2ogr
          end

          @importer_stats.timing('post_ogr2ogr_tasks') do
            post_ogr2ogr_tasks
          end

          self
        end
      rescue StandardError => exception
        begin
          job.delete_job_table
        ensure
          raise exception
        end
      end

      def streamed_run_init
        normalize
        job.log "Detected encoding #{encoding}"
        job.log "Using database connection with #{job.concealed_pg_options}"
        job.log "Running in append mode"
        run_ogr2ogr
      end

      def streamed_run_continue(new_source_file)
        @ogr2ogr.filepath = new_source_file.fullpath
        run_ogr2ogr(append_mode=true)
      end

      def streamed_run_finish(post_import_handler_instance = nil, datasource_name = nil)
        @post_import_handler = post_import_handler_instance

        post_ogr2ogr_tasks(datasource_name)
      end

      def post_ogr2ogr_tasks(datasource_name = nil)
        georeferencer.mark_as_from_geojson_with_transform if post_import_handler.has_transform_geojson_geom_column?

        job.log 'Georeferencing...'
        georeferencer.run
        job.log 'Georeferenced'

        if post_import_handler.has_fix_geometries_task?
          job.log 'Fixing geometry...'
          fix_geometries(job)
        end

        # If autoguessing is enabled, we try it on arcgis data
        autoguessing_on_arcgis_import if datasource_name == 'arcgis' && options[:ogr2ogr_csv_guessing]
      rescue StandardError => e
        raise CartoDB::Datasources::InvalidInputDataError.new(e.to_s, ERRORS_MAP[CartoDB::Datasources::InvalidInputDataError]) unless statement_timeout?(e.to_s)
        raise StatementTimeoutError.new(e.to_s, ERRORS_MAP[CartoDB::Importer2::StatementTimeoutError])
      end

      def fix_geometries(job)
        # At this point the_geom column is renamed
        GeometryFixer.new(job.db, job.table_name, SCHEMA, 'the_geom', job).run
      rescue StandardError => e
        raise e unless statement_timeout?(e.to_s)

        # Ignore timeouts in query batcher
        log_warning(exception: e, message: 'Could not fix geometries during import')
        job.log "Error fixing geometries during import, skipped (#{e.message})"
      end

      def normalize
        converted_filepath = normalizers_for(source_file.extension)
          .inject(source_file.fullpath) { |filepath, normalizer_klass|

            @importer_stats.timing(normalizer_klass.to_s.split('::').last) do
              normalizer = normalizer_klass.new(filepath, job, options[:importer_config])

              FORCE_NORMALIZER_REGEX.each { |regex|
                normalizer.force_normalize if regex =~ source_file.path
              }

              normalizer.run
                        .converted_filepath
            end
          }
        layer = source_file.layer
        @source_file = SourceFile.new(converted_filepath)
        @source_file.layer = layer
        self
      end

      def ogr2ogr
        @ogr2ogr ||= Ogr2ogr.new(
          job.table_name, @source_file.fullpath, job.pg_options, @source_file.layer, ogr2ogr_options
        )
      end

      def ogr2ogr_options
        ogr_options = { encoding: encoding }
        unless options[:ogr2ogr_binary].nil?
          ogr_options.merge!(ogr2ogr_binary: options[:ogr2ogr_binary])
        end
        unless options[:ogr2ogr_csv_guessing].nil?
          ogr_options.merge!(ogr2ogr_csv_guessing: options[:ogr2ogr_csv_guessing])
        end
        unless options[:quoted_fields_guessing].nil?
          ogr_options.merge!(quoted_fields_guessing: options[:quoted_fields_guessing])
        end
        unless options[:ogr2ogr_memory_limit].nil?
          ogr_options.merge!(ogr2ogr_memory_limit: options[:ogr2ogr_memory_limit])
        end

        if source_file.extension == '.shp'
          ogr_options.merge!(shape_encoding: shape_encoding)
          ogr_options.merge!(shape_coordinate_system: '4326') if shapefile_without_prj?
        end
        ogr_options
      end

      def encoding
        @encoding ||= encoding_guess
      end

      def encoding_guess
        normalizer = [ShpNormalizer, CsvNormalizer].find { |normalizer|
          normalizer.supported?(source_file.extension)
        }
        return DEFAULT_ENCODING unless normalizer
        normalizer.new(source_file.fullpath, job, options[:importer_config]).encoding
      end

      def shapefile_without_prj?
        normalizer = [ShpNormalizer].find { |normalizer|
          normalizer.supported?(source_file.extension)
        }
        return false unless normalizer
        !normalizer.new(source_file.fullpath, job).prj_file_present?
      end

      def shape_encoding
        normalizer = [ShpNormalizer].find { |normalizer|
          normalizer.supported?(source_file.extension)
        }
        return nil unless normalizer
        normalizer.new(source_file.fullpath, job).shape_encoding
      end

      def georeferencer
        if @georeferencer.nil?
          @georeferencer = Georeferencer.new(job.db, job.table_name, georeferencer_options, SCHEMA, job, geometry_columns)
          @georeferencer.set_importer_stats(@importer_stats)
        end
        @georeferencer
      end

      def georeferencer_options
        options.select { |key, value| [:guessing, :geocoder, :tracker].include? key }
      end

      def post_import_handler
        @post_import_handler ||= PostImportHandler.new
      end

      def typecaster
        @typecaster ||= Typecaster.new(job.db, job.table_name, SCHEMA, job, ['postedtime'])
      end

      def geometry_columns
        ['wkb_geometry'] if @source_file.extension == '.shp'
      end

      def valid_table_names
        [job.table_name]
      end

      def normalizers_for(extension)
        NORMALIZERS.find_all { |klass|
          klass.supported?(extension)
        }
      end

      def osm?(source_file)
        source_file.extension =~ /\.osm/
      end

      # Not used for now, but for compatibility with tiff_loader
      def additional_support_tables
        []
      end

      attr_accessor   :source_file, :options


      private

      attr_writer     :ogr2ogr, :georeferencer
      attr_accessor   :job, :layer

      # @throws DuplicatedColumnError
      # @throws InvalidGeoJSONError
      # @throws TooManyColumnsError
      # @throws StatementTimeoutError
      # @throws FileTooBigError
      # @throws LoadError
      # @throws UnsupportedFormatError
      def run_ogr2ogr(append_mode=false)
        # INFO: This is a workaround for the append mode
        # Currently it is only used for arcgis importer. In order for this to work
        # properly, it must always be executed before cartodbfy.
        remove_primary_key if append_mode

        ogr2ogr.run(append_mode)

        #In case there are not an specific error we try to fix it
        if ogr2ogr.generic_error? && ogr2ogr.exit_code.zero? || ogr2ogr.missing_srs?
          try_fallback(append_mode)
        end

        @job.source_file_rows = get_source_file_rows
        @job.imported_rows = get_imported_rows

        # too verbose in append mode
        unless append_mode
          job.log "ogr2ogr call:            #{ogr2ogr.command}", truncate = false
          job.log "ogr2ogr output:          #{ogr2ogr.command_output}"
          job.log "ogr2ogr exit code:       #{ogr2ogr.exit_code}"
        end

        check_for_import_errors
      end

      def remove_primary_key
        primary_key = "#{job.table_name}_pkey"
        query = "ALTER TABLE #{SCHEMA}.#{job.table_name} DROP CONSTRAINT IF EXISTS #{primary_key}"
        job.db.run query
      end

      # Sometimes we could try to recover from a known failure
      def try_fallback(append_mode)
        if ogr2ogr.invalid_dates?
          job.log 'Fallback: Autoguessing problem, trying to disable the problematic column'
          @job.fallback_executed = "date"
          ogr2ogr.overwrite = true
          ogr2ogr.csv_guessing = true
          ogr2ogr.quoted_fields_guessing = false
          disable_autoguessing_on_wrong_column(ogr2ogr.filepath, ogr2ogr.command_output)
          ogr2ogr.run(append_mode)
        elsif ogr2ogr.encoding_error?
          job.log "Fallback: There is an encoding problem, trying with ISO-8859-1"
          @job.fallback_executed = "encoding"
          ogr2ogr.overwrite = true
          ogr2ogr.encoding = "ISO-8859-1"
          ogr2ogr.run(append_mode)
        elsif ogr2ogr.missing_srs?
          job.log "Fallback: Source dataset has no coordinate system, forcing -s_srs 4326"
          @job.fallback_executed = "srs 4326"
          ogr2ogr.overwrite = true
          ogr2ogr.shape_coordinate_system = '4326'
          ogr2ogr.run(append_mode)
        end
        ogr2ogr.set_default_properties
      end

      def check_for_import_errors
        raise DuplicatedColumnError.new if ogr2ogr.duplicate_column?
        raise InvalidGeoJSONError.new if ogr2ogr.invalid_geojson?
        raise TooManyColumnsError.new if ogr2ogr.too_many_columns?

        if ogr2ogr.statement_timeout?
          raise StatementTimeoutError.new(ogr2ogr.command_output, ERRORS_MAP[CartoDB::Importer2::StatementTimeoutError])
        end

        if (ogr2ogr.encoding_error? and @job.imported_rows == 0)
          raise RowsEncodingColumnError.new(ogr2ogr.command_output)
        end

        if ogr2ogr.file_too_big?
          raise FileTooBigError.new
        end

        if ogr2ogr.unsupported_format?
          raise UnsupportedFormatError.new
        end

        if ogr2ogr.kml_style_missing?
          raise KmlWithoutStyleIdError.new 'StyleID missing in KML file'
        end

        # Could be OOM, could be wrong input
        if ogr2ogr.segfault_error?
          raise LoadError.new 'Ogr2ogr SEGFAULT ERROR'
        end

        if ogr2ogr.exit_code == 256 && ogr2ogr.encoding_error?
          raise EncodingError.new "Ogr2ogr encoding error"
        end

        if ogr2ogr.geometry_validity_error?
          raise InvalidGeometriesError.new
        end

        # Some kind of error in ogr2ogr could lead to a partial import and we don't want it
        if ogr2ogr.generic_error? || ogr2ogr.exit_code != 0
          job.logger.append "Ogr2ogr FAILED!"
          job.logger.append "ogr2ogr.exit_code = " + ogr2ogr.exit_code.to_s
          job.logger.append "ogr2ogr.command = #{ogr2ogr.command}", false
          job.logger.append "ogr2ogr.command_output = #{ogr2ogr.command_output}", false
          raise LoadError.new 'Ogr2ogr ERROR'
        end
      end

      def get_imported_rows
        #Maybe we could use a cheaper solution
        rows = @job.db.fetch(%Q{SELECT COUNT(1) as num_rows FROM #{SCHEMA}.#{@job.table_name}}).first
        return rows.nil? ? nil : rows.fetch(:num_rows, nil)
      rescue StandardError
        # If there is an import error and try to get the imported rows
        return nil
      end

      def get_source_file_rows
        if is_shp?
          return ShpHelper.new(@source_file.fullpath).total_rows
        else
          return nil
        end
      end

      def is_shp?
        !(@source_file.fullpath =~ /\.shp$/i).nil?
      end

      def statement_timeout?(error)
        error =~ /canceling statement due to statement timeout/i
      end

      def disable_autoguessing_on_wrong_column(filepath, command_output)
        line = /(?<=, line )\d+(?=,)/.match(command_output).to_s.to_i - 1
        column = /(?<=, column )[a-zA-Z]+(?=:)/.match(command_output).to_s.strip
        csv_content = CSV.read(filepath, headers: true)
        csv_content[line][column] = "\"#{csv_content[line][column]}\""
        File.open(filepath, 'w') { |file| file.puts csv_content.to_s }
      end

      def autoguessing_on_arcgis_import
        job.log 'Autoguessing ArcGIS data types...'
        file = File.read(@source_file.fullpath)
        file_content = JSON.parse(file)
        ArcGISAutoguessing.new(job.db, SCHEMA, job.table_name, file_content['fields']).run
      end
    end
  end
end

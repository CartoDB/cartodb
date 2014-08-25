# encoding: utf-8

require 'tempfile'
require 'fileutils'
require 'json'

module CartoDB
  module Datasources
    # TODO: Error handling, now assumes all done ok
    class CSVFileDumper

      ORIGINAL_FILE_EXTENSION = '.json'
      CONVERTED_FILE_EXTENSION = '.csv'

      FILE_DUMPER_TMP_SUBFOLDER = '/tmp/csv_file_dumper/'

      def initialize(json_to_csv_conversor, debug_mode = false)
        @debug_mode = debug_mode
        @json2csv_conversor = json_to_csv_conversor
        @temporary_directory = nil

        @additional_fields = {}

        @files = {}
        @original_files = {}
      end

      def additional_fields=(data = {})
        @additional_fields = data
      end

      # @param name String
      def begin_dump(name)
        # Create temp file & open
        @files[name] = temporary_file(name)
        @original_files[name] = temporary_file(name, ORIGINAL_FILE_EXTENSION) if @debug_mode
      end

      # @param name String
      # @param data Array
      # @return Integer number of items dumped
      def dump(name, data = [])
        @files[name].write(@json2csv_conversor.process(data, false, @additional_fields[name]) + "\n")
        @original_files[name].write(::JSON.dump(data) + "\n") if @debug_mode
        data.count
      end

      # @param name String
      def end_dump(name)
        if @files[name]
          @files[name].close
        end
        if @original_files[name]
          @original_files[name].close
        end
      end

      # @param names_list Array
      # @return String
      def merge_dumps(names_list = [])
        return_data = @json2csv_conversor.generate_headers(@additional_fields[names_list.first]) + "\n"

        names_list.each { |name|
          return_data += File.read(@files[name].path)
          @files[name].unlink unless @debug_mode
        }

        # Remove final trailing newline before returning
        return_data.gsub(/\n$/, '')
      end

      # Return a new temporary file contained inside a tmp subfolder
      # @param base_name String|nil (optional)
      def temporary_file(base_name = '', extension = CONVERTED_FILE_EXTENSION)
        FileUtils.mkdir_p(FILE_DUMPER_TMP_SUBFOLDER) unless File.directory?(FILE_DUMPER_TMP_SUBFOLDER)
        Tempfile.new([base_name, extension], FILE_DUMPER_TMP_SUBFOLDER)
      end

      def file_paths
        @files.values.map { |file|
          file.path
        }
      end

      def original_file_paths
        @original_files.values.map { |file|
          file.path
        }
      end

      private

      # Intended for tests
      def destroy_files
        @files.keys.each { |key|
          @files[key].close!
        }
        @original_files.keys.each { |key|
          @original_files[key].close!
        }
      end

    end
  end
end

require 'tempfile'
require 'fileutils'
require 'json'

module CartoDB
  module Datasources
    # TODO: Error handling, now assumes all done ok
    class CSVFileDumper

      ORIGINAL_FILE_EXTENSION = '.json'
      CONVERTED_FILE_EXTENSION = '.csv'
      HEADERS_FILE_EXTENSION = '_headers.csv'

      FILE_DUMPER_TMP_SUBFOLDER = '/tmp/csv_file_dumper/'

      OUTPUT_ENCODING = 'utf-8'

      def initialize(json_to_csv_conversor, debug_mode = false)
        @debug_mode = debug_mode
        @json2csv_conversor = json_to_csv_conversor
        @temporary_directory = nil
        @temporary_folder = Time.now.strftime("%Y%m%d_%H%M%S_") + rand(1000).to_s

        @additional_fields = {}

        @files = {}
        @original_files = {}
        @headers_file = nil
        @buffer_size = 8192
      end

      def buffer_size=(value)
        @buffer_size = value.to_i if value.to_i > 0
      end

      def additional_fields=(data = {})
        @additional_fields = data
      end

      # This class uses a temporal CSV file per name
      # optionally dumping also the source JSON in another file if in debug mode
      # @param name String
      def begin_dump(name)
        # Create temp file & open
        @files[name] = temporary_file(name)
        @original_files[name] = temporary_file(name, ORIGINAL_FILE_EXTENSION) if @debug_mode
        @headers_file = temporary_file('', HEADERS_FILE_EXTENSION) if @debug_mode
      end

      # @param name String
      # @param data Array
      # @return Integer number of items dumped
      def dump(name, data = [])
        processed_data = @json2csv_conversor.process(data, false, @additional_fields[name]) + "\n"
        processed_data.encode!(OUTPUT_ENCODING, replace: '')
        @files[name].write(processed_data)
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
      # @param stream IO
      def merge_dumps_into_stream(names_list, stream)
        headers = @json2csv_conversor.generate_headers(@additional_fields[names_list.first]) + "\n"

        streamed_size = headers.length

        stream.write(headers)

        names_list.each do |name|
          input_stream = File.open(@files[name].path)

          begin
            buffer = input_stream.read(@buffer_size)
            if buffer
              stream.write(buffer)
              streamed_size += buffer.length
            end
          end while buffer

          input_stream.close

          @files[name].unlink unless @debug_mode
        end

        if @debug_mode && !@headers_file.nil?
          @headers_file.write(headers)
          @headers_file.close
        end

        streamed_size
      end

      # @param names_list Array
      # @return String
      def merge_dumps(names_list = [])
        headers = @json2csv_conversor.generate_headers(@additional_fields[names_list.first]) + "\n"
        return_data = headers

        return_data.encode!(OUTPUT_ENCODING, replace: '')

        if @debug_mode && !@headers_file.nil?
          @headers_file.write(headers)
          @headers_file.close
        end

        names_list.each do |name|
          return_data << File.read(@files[name].path)
          @files[name].unlink unless @debug_mode
        end

        # Remove final trailing newline before returning
        return_data.sub(/\n$/, '')
      end

      # Return a new temporary file contained inside a tmp subfolder
      # @param base_name String|nil (optional)
      def temporary_file(base_name = '', extension = CONVERTED_FILE_EXTENSION)
        FileUtils.mkdir_p(FILE_DUMPER_TMP_SUBFOLDER) unless File.directory?(FILE_DUMPER_TMP_SUBFOLDER)

        temps_full_path = FILE_DUMPER_TMP_SUBFOLDER + @temporary_folder + '/'
        FileUtils.mkdir_p(temps_full_path)

        # For the default scenario force encoding, for original files don't touch anything
        if extension == CONVERTED_FILE_EXTENSION
          Tempfile.new([base_name.gsub(' ', '_'), extension], temps_full_path, encoding: OUTPUT_ENCODING)
        else
          Tempfile.new([base_name.gsub(' ', '_'), extension], temps_full_path)
        end
      end

      def file_paths
        @files.values.map(&:path)
      end

      def original_file_paths
        @original_files.values.map(&:path)
      end

      def headers_path
        @headers_file.path unless @headers_file.nil?
      end

      def clean_string(contents)
        @json2csv_conversor.clean_string(contents)
      end

      private

      # Intended for tests
      def destroy_files
        @files.keys.each { |key| @files[key].close! }
        @original_files.keys.each { |key| @original_files[key].close! }
        @headers_file.close! unless @headers_file.nil?
      end

    end
  end
end

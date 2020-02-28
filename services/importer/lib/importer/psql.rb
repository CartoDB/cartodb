require 'open3'

module CartoDB
  module Importer2
    class Psql
      SCHEMA                    = 'cdb_importer'
      START_CREATE_TABLE_REGEX  = /CREATE TABLE\s\w*\s\(/
      END_CREATE_TABLE_REGEX    = /\);/
      START_COPY_REGEX          = /COPY\s.*\s\(/
      END_COPY_REGEX            = /\\\./

      def initialize(table_name, filepath, pg_options)
        self.table_name   = table_name
        self.filepath     = filepath
        self.pg_options   = pg_options
      end

      def run(*args)
        Open3.popen2(command) { |stdin, stdout_stderr,thread|
          stream = File.open(filepath)
          stdin.write(create_table_statement(stream))
          stdin.write(copy_statement(stream))
          copy_records(stream, stdin)
          stdin.write("\\q\n")

          stream.close
          self.command_output = stdout_stderr.read
          self.exit_code      = thread.value
        }
        self
      end

      def command
        %Q(#{command_path} ) +
        %Q(--host=#{pg_options.fetch(:host)} )  +
        %Q(--port=#{pg_options.fetch(:port)} )  +
        %Q(--user=#{pg_options.fetch(:user)} )  +
        %Q(--file=- )                           +
        %Q(#{pg_options.fetch(:database)} )
      end
      
      def command_path
        `which psql`.strip
      end

      def create_table_statement(stream)
        stream.rewind
        skip_lines(stream, START_CREATE_TABLE_REGEX) 
        %Q(CREATE TABLE "#{SCHEMA}"."#{table_name}" (\n#{schema_from(stream)});\n)
      end

      def copy_statement(stream)
        stream.rewind
        line = skip_lines(stream, START_COPY_REGEX)
        line.gsub(START_COPY_REGEX, %Q[COPY "#{SCHEMA}"."#{table_name}" (])
      end

      def schema_from(stream)
        schema = ''

        while line = stream.readline do
          break if END_CREATE_TABLE_REGEX.match(line)
          schema.concat(line)
        end

        schema
      end

      def skip_lines(stream, regex)
        while line = stream.readline do break if regex.match(line) end
        line
      end

      def copy_records(stream, stdin)
        while line = stream.readline do
          stdin.write(line)
          break if END_COPY_REGEX.match(line)
        end
      end

      attr_accessor :table_name, :filepath, :pg_options,
                    :command_output, :exit_code
    end
  end
end


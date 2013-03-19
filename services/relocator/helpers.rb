# encoding: utf-8

module CartoDB
  module Relocator
    module Helpers
      def to_stdout(text)
        marker = '=' * 10
        puts [Time.now, marker, text].join(' ')
      end #to_stdout

      def print_and_raise(stderr)
        puts
        puts '*' * 80
        puts
        puts ' ' * 10 + "COMMAND EXITED WITH ERRORS"
        puts
        puts stderr.read
        puts
        puts '*' * 80
        puts
        raise 'Command exited with errors'
      end #print_and_raise

    end # Helpers
  end # Relocator
end # CartoDB


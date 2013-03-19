# encoding: utf-8
require 'open3'

module Workman
  module Job
    class Command
      ARGUMENT_SEPARATOR = ' '

      attr_reader :result

      def initialize(executable, arguments=[])
        @executable = executable
        @arguments  = arguments.join(ARGUMENT_SEPARATOR)
      end #initialize

      def run
        @stdin, @stdout, @stderr = Open3.popen3("#{executable} #{arguments}")
        result_from(stdout)
      end #run

      def success?
        stderr.readlines.empty?
      end #success?

      def error?
        !success?
      end #error?

      private

      attr_reader :executable, :arguments, :stdin, :stdout, :stderr

      def result_from(descriptor)
        @result = descriptor.readlines.join
      end #result_from
    end # Command
  end # Job
end # Workman


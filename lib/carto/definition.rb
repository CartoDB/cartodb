# encoding: utf-8

require 'singleton'

module Carto
  class Definition
    include Singleton

    def initialize
      @definitions = {}
    end

    def load_from_file(file_path)
      return @definitions[file_path] if @definitions[file_path]

      definition_file = File.read(file_path)

      @definitions[file_path] = JSON.parse(definition_file).with_indifferent_access
    rescue Errno::ENOENT
      message = 'Carto::Definition: Couldn\'t read from file'
      CartoDB::Logger.error(message: message, file_path: file_path)

      raise message
    end
  end
end

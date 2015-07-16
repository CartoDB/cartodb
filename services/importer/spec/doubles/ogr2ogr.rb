# encoding: utf-8

module CartoDB
  module Importer2
    module Doubles
      class Ogr2ogr
        attr_accessor :exit_code, :command, :command_output
        def initialize
          self.exit_code = 0
          self.command = String.new
          self.command_output = String.new
        end
        def run(append_mode=false)
          Object.new
        end
      end
    end
  end
end


# encoding: utf-8
require 'csv'

module CartoDB
  module Importer
    module Factories
      class CSV
        def initialize(name=nil)
          @name       = name || "importer#{rand(999)}"
          @filepath   = "/var/tmp/#{@name}.csv"
        end #initialize

        def write(header=nil, data=nil)
          header  ||= ["header_1", "header_2"]
          data    ||= ["cell_#{rand(999)}", "cell_#{rand(999)}"]

          ::CSV.open(filepath, "wb") do |csv|
            csv << header
            10.times { csv << data }
          end

          self
        end #write
        
        def delete
          File.delete(filepath)
          self
        end #delete

        attr_reader :name, :filepath
      end # CSV
    end # Factories
  end # Importer
end # CartoDB


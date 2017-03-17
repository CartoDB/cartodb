# encoding: utf-8
require 'csv'

module CartoDB
  module Importer2
    module Factories
      class CSV
        # Duplicates set to 9 (+1 for the original) for legacy specs
        def initialize(name=nil, how_many_duplicates=9)
          @name       = name || "importer#{rand(999)}"
          @filepath   = "/var/tmp/#{@name}.csv"
          @how_many_duplicates = how_many_duplicates
        end

        def write(header=nil, data=nil, columns=2, rows=10)
          header  ||= (1..columns).map { |index| "header_#{index}" }
          data    ||= (1..rows).map { "cell_#{rand(999)}" }

          ::CSV.open(filepath, "wb") do |csv|
            csv << header
            (@how_many_duplicates + 1).times {
              csv << data
            }
          end

          self
        end

        def delete
          File.delete(filepath)
          self
        end

        attr_reader :name, :filepath
      end
    end
  end
end

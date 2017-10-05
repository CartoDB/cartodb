module Carto
  module SourceValidation
    def validate_source(visualization, source, attribute)
      return unless source && visualization

      sources = visualization.analyses.map(&:all_analysis_nodes).flatten
      unless sources.map(&:id).include?(source)
        errors.add(attribute, "Source analysis #{source} does not exist")
      end
    end
  end
end

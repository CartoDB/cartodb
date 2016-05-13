# encoding: utf-8

module Carto
  module Api
    class AnalysisPresenter

      def initialize(analysis)
        @analysis = analysis
      end

      def to_poro
        return {} unless @analysis

        {
          id: @analysis.id,
          analysis_definition: @analysis.analysis_definition
        }
      end

    end
  end
end

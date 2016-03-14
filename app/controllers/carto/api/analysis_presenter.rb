# encoding: utf-8

module Carto
  module Api
    class AnalysisPresenter

      def initialize(analysis)
        @analysis = analysis
      end

      def to_poro
        return {} unless @analysis

        @analysis.params_json
      end

    end
  end
end

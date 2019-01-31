# encoding: utf-8

module Carto
  module Api
    class TagPresenter

      def initialize(tag)
        @tag = tag
      end

      def to_poro
        return {} unless @tag

        {
          tag: @tag.tag,
          maps: @tag.derived_count.to_i,
          datasets: @tag.table_count.to_i
        }
      end

    end
  end
end

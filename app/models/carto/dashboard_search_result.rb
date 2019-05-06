module Carto
  class DashboardSearchResult

    attr_accessor :tags, :visualizations, :total_count

    def initialize(tags: [], visualizations: [], total_count: 0)
      @tags = tags
      @visualizations = visualizations
      @total_count = total_count
    end
  end
end

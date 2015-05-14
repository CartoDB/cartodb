# encoding: utf-8

class Carto::Api::TagsController < Api::ApplicationController
  include Carto::Api::VisualizationSearcher

  ssl_required :index

  def index
    render_jsonp(tag_counts.map { |tag, count|
      { name: tag, count: count }
    })
  end

  private

  def tag_counts
    tc = visualizations.map(&:tags).flatten
    tc.inject(Hash.new(0)) { |counts, tag|
      counts[tag] = counts[tag] += 1
      counts
    }
  end

  def visualizations
    query_builder_with_filter_from_hash(params).build.all
  end

end

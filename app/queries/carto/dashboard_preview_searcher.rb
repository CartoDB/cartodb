# encoding: UTF-8

require 'active_record'

class Carto::DashboardPreviewSearcher

  delegate :url_helpers, to: 'Rails.application.routes'

  DEFAULT_TYPES = %w(table derived remote tag).freeze

  def initialize(user:, context: nil, pattern:, types: DEFAULT_TYPES)
    @user = user
    @context = context
    @pattern = pattern
    types = DEFAULT_TYPES unless types.present?
    @visualization_types = types - ["tag"]
    @include_tags = types.include?("tag")
  end

  def search(limit:)
    tag_query_builder = initialize_builder(Carto::TagQueryBuilder)
    tags = tag_query_builder.build_paged(1, limit)
    formatted_tags = format_tags(tags)

    visualization_query_builder = initialize_builder(Carto::VisualizationQueryBuilder)
    visualizations = visualization_query_builder.build_paged(1, limit)
    formatted_visualizations = format_visualizations(visualizations)

    (formatted_tags + formatted_visualizations).first(limit)
  end

  def total_count
    tag_query_builder = initialize_builder(Carto::TagQueryBuilder)
    tag_count = tag_query_builder.total_count

    visualization_query_builder = initialize_builder(Carto::VisualizationQueryBuilder)
    visualization_count = visualization_query_builder.build.count

    tag_count + visualization_count
  end

  private

  def initialize_builder(builder_class)
    builder_class.new
                 .with_owned_by_or_shared_with_user_id(@user.id)
                 .with_types(@visualization_types)
                 .with_partial_match(@pattern)
  end

  def format_tags(tags)
    tags.map do |tag|
      {
        type: "tag",
        name: tag[:tag],
        url: "WIP"
      }
    end
  end

  def format_visualizations(visualizations)
    visualizations.map do |visualization|
      {
        type: visualization.type,
        name: visualization.name,
        url: "WIP"
      }
    end
  end

end

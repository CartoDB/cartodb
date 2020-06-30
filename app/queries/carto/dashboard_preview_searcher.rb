require 'active_record'

class Carto::DashboardPreviewSearcher

  delegate :url_helpers, to: 'Rails.application.routes'

  DEFAULT_TYPES = %w(table derived remote tag).freeze

  def initialize(user:, pattern:, types: DEFAULT_TYPES, limit:)
    @user = user
    @pattern = pattern
    types = DEFAULT_TYPES unless types.present?
    @visualization_types = types - ["tag"]
    @include_tags = types.include?("tag")
    @limit = limit
  end

  def search
    result = Carto::DashboardSearchResult.new

    if @include_tags
      tag_query_builder = initialize_builder(Carto::TagQueryBuilder)
      tag_results = tag_query_builder.build_paged(1, @limit)
      result.tags = tag_results.map { |hash| hash[:tag] }
      result.total_count += tag_query_builder.total_count
    end

    if @visualization_types.any?
      visualization_query_builder = initialize_builder(Carto::VisualizationQueryBuilder)
      result.visualizations = visualization_query_builder.build_paged(1, @limit).to_a
      result.total_count += visualization_query_builder.count
    end

    result
  end

  private

  def initialize_builder(builder_class)
    builder_class.new
                 .with_owned_by_or_shared_with_user_id(@user.id)
                 .with_types(@visualization_types)
                 .with_partial_match(@pattern)
  end

end

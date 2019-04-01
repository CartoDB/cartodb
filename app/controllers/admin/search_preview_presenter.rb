class Admin::SearchPreviewPresenter

  def initialize(dashboard_search_result:, limit:, current_viewer:, context:)
    @dashboard_search_result = dashboard_search_result
    @limit = limit
    @current_viewer = current_viewer
    @context = context
  end

  def to_poro
    result = (poro_tags + poro_visualizations).first(@limit)
    {
      result: result,
      total_count: @dashboard_search_result.total_count
    }
  end

  private

  def poro_tags
    @dashboard_search_result.tags.map do |tag|
      {
        type: "tag",
        name: tag,
        url: CartoDB.url(@context, "tag_search", user: @user, params: { q: tag })
      }
    end
  end

  def poro_visualizations
    @dashboard_search_result.visualizations.map do |visualization|
      Carto::Api::VisualizationPresenter.new(visualization, @user, @context).to_search_preview_poro
    end
  end
end

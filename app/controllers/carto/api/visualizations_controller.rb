class Carto::Api::VisualizationsController < Api::ApplicationController

  def index
    vqb = Carto::VisualizationQueryBuilder.new.with_user_id(current_user.id)
    visualizations = vqb.build.all
    response = {
      visualizations: visualizations,
      total_entries: 0,
      total_user_entries: 0,
      total_likes: 0,
      total_shared: 0
    }
    render_jsonp(response)
  end
end

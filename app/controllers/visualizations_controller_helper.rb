module VisualizationsControllerHelper
  # Implicit order due to legacy code: 1st return canonical/table/Dataset if present, else derived/visualization/Map
  def get_priority_visualization(visualization_id, user_id: nil, organization_id: nil)
    Carto::VisualizationQueryBuilder.new
                                    .with_id_or_name(visualization_id)
                                    .with_user_id(user_id)
                                    .with_organization_id(organization_id)
                                    .build
                                    .all
                                    .sort do |vis_a, _vis_b|
                                      vis_a.type == Carto::Visualization::TYPE_CANONICAL ? -1 : 1
                                    end
                                    .first
  end

  def load_visualization_from_id_or_name(id)
    user = Carto::User.where(username: extract_subdomain(request)).first
    user_id = user.nil? ? nil : user.id

    visualization = get_priority_visualization(id, user_id: user_id)

    render_404 && return if visualization.nil?

    visualization
  end

  def generate_vizjson3(visualization, params)
    Carto::Api::VizJSON3Presenter.new(visualization, $tables_metadata).to_vizjson(https_request: is_https?,
                                                                                  vector: params[:vector] == 'true')
  end
end

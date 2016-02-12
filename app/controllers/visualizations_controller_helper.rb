module VisualizationsControllerHelper
  # Implicit order due to legacy code: 1st return canonical/table/Dataset if present, else derived/visualization/Map
  def get_priority_visualization(visualization_id, user_id)
    Carto::VisualizationQueryBuilder.new
                                    .with_id_or_name(visualization_id)
                                    .with_user_id(user_id)
                                    .build
                                    .all
                                    .sort do |vis_a, _vis_b|
                                      vis_a.type == Carto::Visualization::TYPE_CANONICAL ? -1 : 1
                                    end
                                    .first
  end

  def load_visualization_from_id(id)
    visualization = get_priority_visualization(id, current_user.id)

    render_404 && return if visualization.nil?
    render_403 && return unless allowed?(visualization)

    visualization
  end

  def allowed?(visualization)
    !(visualization.type_slide? || visualization.kind_raster? || !visualization.is_writable_by_user(current_user))
  end
end

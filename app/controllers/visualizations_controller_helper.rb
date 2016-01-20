module VisualizationsControllerHelper
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
end

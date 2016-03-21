require_dependency 'carto/uuidhelper'
require_dependency 'carto/api/vizjson3_presenter'

module VisualizationsControllerHelper
  class VisualizationLocator
    include Carto::UUIDHelper

    def initialize(visualization_locator)
      table_id_or_name, @schema = visualization_locator.split('.').reverse

      if is_uuid?(table_id_or_name)
        @id = table_id_or_name
      else
        @name = table_id_or_name
      end
    end

    def id
      @id
    end

    def name
      @name
    end

    def schema
      @schema
    end

    def matches_visualization?(visualization)
      return false unless visualization
      return false if id && id != visualization.id
      return false if name && name != visualization.name
      return false if schema && schema != visualization.user.database_schema
      true
    end
  end

  def extract_user_from_request_and_viz_locator(viz_locator)
    # 1. Handles any url with "/u/username", or "username.cartodb.com"
    user_or_org_name = CartoDB.extract_subdomain(request)
    user = Carto::User.where(username: user_or_org_name).first
    return user unless user.nil?

    # 2. Handles org.cartodb.com with "schema.table" visualizations
    if viz_locator.schema
      organization = Carto::Organization.where(name: user_or_org_name).first
      return nil unless organization
      organization.users.where(username: viz_locator.schema).first
    end
  end

  # Implicit order due to legacy code: 1st return canonical/table/Dataset if present, else derived/visualization/Map
  def get_priority_visualization(visualization_id, user_id: nil, organization_id: nil)
    Carto::VisualizationQueryBuilder.new
                                    .with_id_or_name(visualization_id)
                                    .with_user_id(user_id)
                                    .with_organization_id(organization_id)
                                    .build
                                    .all
                                    .sort { |vis_a, _vis_b|
                                      vis_a.type == Carto::Visualization::TYPE_CANONICAL ? -1 : 1
                                    }
                                    .first
  end

  def load_visualization_from_id_or_name(id_or_name)
    viz_locator = VisualizationLocator.new(id_or_name)
    if viz_locator.id
      visualization = get_priority_visualization(viz_locator.id)
    else
      user = extract_user_from_request_and_viz_locator(viz_locator)
      visualization = user.nil? ? nil : get_priority_visualization(viz_locator.name, user_id: user.id)
    end

    render_404 && return unless viz_locator.matches_visualization?(visualization)
    visualization
  end

  def generate_vizjson3(visualization, params)
    Carto::Api::VizJSON3Presenter.new(visualization, $tables_metadata).to_vizjson(https_request: is_https?,
                                                                                  vector: params[:vector] == 'true')
  end
end

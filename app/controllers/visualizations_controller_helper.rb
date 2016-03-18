require 'carto/uuidhelper'

module VisualizationsControllerHelper
  class VisualizationLocator
    extend Carto::UUIDHelper

    def self.parse_table_locator(table_locator)
      table_id_or_name, @schema = table_locator.split('.').reverse

      if is_uuid?(table_id_or_name)
        @id = table_id_or_name
      else
        @name = table_id_or_name
      end
    end

    def self.load_user_or_organization(user_or_org_name)
      user = Carto::User.where(username: user_or_org_name).first
      if user
        @user = user
      else
        @organization = Carto::organization.where(username: user_or_org_name).first
      end
    end

    def self.find(table_locator, user_or_org_name)
      parse_table_locator(table_locator)
      load_user_or_organization(user_or_org_name)

      if @id
        visualization = Carto::VisualizationQueryBuilder.new.with_id(@id).build.first
      elsif @name && @user
        visualization = get_priority_visualization(@name, user_id: @user.id)
      elsif @name && @organization && @schema
        user_from_schema = @organization.users.where(username: @schema).first
        if user_from_schema
          visualization = get_priority_visualization(@name, user_id: user_from_schema.id)
        end
      end

      visualization if visualization && validate_result(visualization)
    end

    def self.validate_result(visualization)
      return false if @id && @id != visualization.id
      return false if @name && @name != visualization.name
      return false if @schema && @schema != visualization.user.database_schema
      return false if @user && @user != visualization.user
      return false if @organization && @organization != visualization.user.organization
      true
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
    visualization = VisualizationLocator.find(id_or_name, CartoDB.extract_subdomain(request))
    render_404 && return if visualization.nil?
    visualization
  end

  def generate_vizjson3(visualization, params)
    Carto::Api::VizJSON3Presenter.new(visualization, $tables_metadata).to_vizjson(https_request: is_https?,
                                                                                  vector: params[:vector] == 'true')
  end
end

require_dependency 'carto/uuidhelper'
require_dependency 'carto/api/vizjson3_presenter'

module VisualizationsControllerHelper
  # This class represents a "visualization locator", as string in one of the following formats:
  # <viz_uuid>, <viz_name>, <schema>.<viz_uuid>, <schema.viz_name>
  # It parses it provides methods to access the different fields, and allows to validate if a
  # visualization matches the "visualization locator" string.
  # This allows flexible specification of visualization names in URL's, accepting canonical
  # visualizations (usually by name) and derived visualizations (by uuid).
  class VisualizationLocator
    include Carto::UUIDHelper

    def initialize(visualization_locator_string, force_name: false)
      table_id_or_name, @schema = visualization_locator_string.split('.').reverse

      if !force_name && is_uuid?(table_id_or_name)
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
    # 1. Handles any url with "/u/username", or "username.carto.com"
    user_or_org_name = CartoDB.extract_subdomain(request)
    user = Carto::User.where(username: user_or_org_name).first

    if user.nil?
      # 2a. User not found: handles org.carto.com with "schema.table" visualizations
      organization = Carto::Organization.where(name: user_or_org_name).first
      return nil unless organization
      organization.users.where(username: viz_locator.schema).first
    elsif user.organization.present?
      # 2b. User found in org: handles visualizations shared in the org
      org_user = user.organization.users.where(username: viz_locator.schema).first
      org_user.nil? ? user : org_user
    else
      # Found user not in organization
      user
    end
  end

  # Implicit order due to legacy code: 1st return canonical/table/Dataset if present, else derived/visualization/Map
  def get_priority_visualization(visualization_id, user_id: nil, organization_id: nil)
    params = { user_id: user_id, organization_id: organization_id }
    visualization = get_priority_visualization_forcing_name(visualization_id, params.merge(force_name: false))
    unless visualization
      visualization = get_priority_visualization_forcing_name(visualization_id, params.merge(force_name: true))
    end
    visualization
  end

  def load_visualization_from_id_or_name(id_or_name)
    visualization = load_visualization_from_id_or_name_guessing(id_or_name, force_name: false)
    # Support for tables named with uuids (see #9142)
    visualization = load_visualization_from_id_or_name_guessing(id_or_name, force_name: true) unless visualization
    visualization
  end

  def load_visualization_from_id_or_name_guessing(id_or_name, force_name:)
    viz_locator = VisualizationLocator.new(id_or_name, force_name: force_name)

    visualization = if viz_locator.id
                      get_priority_visualization_forcing_name(viz_locator.id, force_name: force_name)
                    else
                      user = extract_user_from_request_and_viz_locator(viz_locator)
                      if user.nil?
                        nil
                      else
                        get_priority_visualization_forcing_name(
                          viz_locator.name, force_name: force_name, user_id: user.id)
                      end
                    end

    viz_locator.matches_visualization?(visualization) ? visualization : nil
  end

  def generate_vizjson3(visualization)
    Carto::Api::VizJSON3Presenter.new(visualization)
                                 .to_vizjson(https_request: is_https?)
  end

  def generate_named_map_vizjson3(visualization)
    Carto::Api::VizJSON3Presenter.new(visualization)
                                 .to_named_map_vizjson(https_request: is_https?)
  end

  def generate_anonymous_map_vizjson3(visualization)
    Carto::Api::VizJSON3Presenter.new(visualization)
                                 .to_anonymous_map_vizjson(https_request: is_https?)
  end
  private

  def get_priority_visualization_forcing_name(visualization_id, force_name: false, user_id: nil, organization_id: nil)
    builder = if force_name
                Carto::VisualizationQueryBuilder.new.with_name(visualization_id)
              else
                Carto::VisualizationQueryBuilder.new.with_id_or_name(visualization_id)
              end

    builder.with_user_id(user_id)
           .with_organization_id(organization_id)
           .build
           .all
           .sort { |vis_a, _vis_b|
             vis_a.type == Carto::Visualization::TYPE_CANONICAL ? -1 : 1
           }
           .first
  end
end

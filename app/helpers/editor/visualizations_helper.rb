module Editor
  module VisualizationsHelper

    MAX_MORE_VISUALIZATIONS = 3

    def load_visualization_and_table
      filters = { exclude_raster: true }

      @visualization, @table = get_visualization_and_table(@table_id,
                                                           @schema || CartoDB.extract_subdomain(request),
                                                           filters)

      if @visualization && @visualization.user
        @more_visualizations = more_visualizations(@visualization.user, @visualization)
      end

      render_pretty_404 if disallowed_type?(@visualization)
    end

    def load_common_data
      return true unless current_user.present?

      begin
        visualizations_api_url = CartoDB::Visualization::CommonDataService.build_url(self)
        ::Resque.enqueue(::Resque::UserJobs::CommonData::LoadCommonData, current_user.id, visualizations_api_url) if current_user.should_load_common_data?
      rescue Exception => e
        # We don't block the load of the dashboard because we aren't able to load common data
        CartoDB.notify_exception(e, {user:current_user})
        return true
      end
    end

    def render_pretty_404
      render(file: "public/404.html", layout: false, status: 404)
    end

    def update_user_last_activity
      return false unless current_user.present?
      current_user.set_last_active_time
      current_user.set_last_ip_address request.remote_ip
    end

    private

    def disallowed_type?(visualization)
      return true if visualization.nil?
      visualization.type_slide?
    end

    def get_visualization_and_table(table_id, schema, filter)
      user = Carto::User.where(username: schema).first
      # INFO: organization public visualizations
      user_id = user ? user.id : nil

      # Implicit order due to legacy code: 1st return canonical/table/Dataset if present, else derived/visualization/Map
      visualization = Carto::VisualizationQueryBuilder.new
                                                      .with_id_or_name(table_id)
                                                      .with_user_id(user_id)
                                                      .build
                                                      .all
                                                      .sort { |vis_a, vis_b|
                                                          vis_a.type == Carto::Visualization::TYPE_CANONICAL ? -1 : 1
                                                        }
                                                      .first

      return get_visualization_and_table_from_table_id(table_id) if visualization.nil?
      render_pretty_404 if visualization.kind == CartoDB::Visualization::Member::KIND_RASTER
      return Carto::Admin::VisualizationPublicMapAdapter.new(visualization, current_user, self), visualization.table_service
    end

    def get_visualization_and_table_from_table_id(table_id)
      return nil, nil if !is_uuid?(table_id)

      user_table = Carto::UserTable.where({ id: table_id }).first
      return nil, nil if user_table.nil?

      visualization = user_table.visualization
      return Carto::Admin::VisualizationPublicMapAdapter.new(visualization, current_user, self), visualization.table_service
    end

    def more_visualizations(user, excluded_visualization)
      vqb = Carto::VisualizationQueryBuilder.user_public_visualizations(user).with_order(:updated_at, :desc)

      vqb.with_excluded_ids([excluded_visualization.id]) if excluded_visualization

      visualizations = vqb.build_paged(1, MAX_MORE_VISUALIZATIONS)

      visualizations.map do |v|
        Carto::Admin::VisualizationPublicMapAdapter.new(v, current_user, self)
      end
    end
  end
end

require_relative 'visualization_presenter'
require_relative 'vizjson_presenter'
require_relative '../../../models/visualization/stats'

module Carto
  module Api
    class VisualizationsController < ::Api::ApplicationController
      include VisualizationSearcher

      # TODO: compare with older, there seems to be more optional authentication endpoints
      skip_before_filter :api_authorization_required, only: [:index, :vizjson2, :is_liked]
      before_filter :optional_api_authorization, only: [:index, :vizjson2, :is_liked]

      before_filter :id_and_schema_from_params
      before_filter :load_table, only: [:vizjson2]
      before_filter :load_visualization, only: [:likes_count, :likes_list, :is_liked, :show, :stats, :list_watching]
      ssl_required :index, :show
      ssl_allowed  :vizjson2, :likes_count, :likes_list, :is_liked, :list_watching

      def id_and_schema_from_params
        if params.fetch('id', nil) =~ /\./
          @id, @schema = params.fetch('id').split('.').reverse
        else
          @id, @schema = [params.fetch('id', nil), nil]
        end
      end

      def load_visualization
        # Implicit order due to legacy code: 1st return canonical/table/Dataset if present, else derived/visualization/Map
        @visualization = Carto::VisualizationQueryBuilder.new
                                                         .with_id_or_name(@id)
                                                         .build
                                                         .all
                                                         .sort { |vis_a, vis_b|
                                                              vis_a.type == Carto::Visualization::TYPE_CANONICAL ? -1 : 1
                                                            }
                                                         .first

        return render(text: 'Visualization does not exist', status: 404) if @visualization.nil?
        return render(text: 'Visualization not viewable', status: 403) if !@visualization.is_viewable_by_user?(current_viewer)
      end

      def load_table
        # TODO: refactor this for vizjson, that uses to look for a visualization, so it should come first

        @table = Carto::UserTable.where(id: @id).first
        # TODO: id should _really_ contain either an id of a user_table or a visualization??
        # Some tests fail if not, and older controller works that way, but...
        if @table
          @visualization = @table.visualization
        else
          @table = Visualization.where(id: @id).first
          @visualization = @table
          # TODO: refactor load_table duplication
          return render(text: 'Visualization does not exist', status: 404) if @visualization.nil?
          return render(text: 'Visualization not viewable', status: 403) if !@visualization.is_viewable_by_user?(current_viewer)
        end
      end

      def show
        render_jsonp(to_json(@visualization))
      rescue KeyError
        head(404)
      end

      def index
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 20).to_i
        order = (params[:order] || 'updated_at').to_sym
        types, total_types = get_types_parameters
        vqb = query_builder_with_filter_from_hash(params)

        # TODO: undesirable table hardcoding, needed for disambiguation. Look for
        # a better approach and/or move it to the query builder
        response = {
          visualizations: vqb.with_order("visualizations.#{order}", :desc).build_paged(page, per_page).map { |v| VisualizationPresenter.new(v, current_viewer, { related: false }).to_poro },
          total_entries: vqb.build.count
        }
        if current_user
          response.merge!({
            total_user_entries: VisualizationQueryBuilder.new.with_types(total_types).with_user_id(current_user.id).build.count,
            total_likes: VisualizationQueryBuilder.new.with_types(total_types).with_liked_by_user_id(current_user.id).build.count,
            total_shared: VisualizationQueryBuilder.new.with_types(total_types).with_shared_with_user_id(current_user.id).with_user_id_not(current_user.id).build.count
          })
        end
        render_jsonp(response)
      end

      def likes_count
        render_jsonp({
          id: @visualization.id,
          likes: @visualization.likes.count
        })
      end

      def likes_list
        render_jsonp({
          id: @visualization.id,
          likes: @visualization.likes.map { |like| { actor_id: like.actor } }
        })
      end

      def is_liked
        render_jsonp({
          id: @visualization.id,
          likes: @visualization.likes.count,
          liked: @visualization.is_liked_by_user_id?(current_viewer.id)
        })
      end

      def vizjson2
        set_vizjson_response_headers_for(@visualization)
        render_jsonp(Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).to_vizjson( { https_request: is_https? } ))
      rescue KeyError => exception
        render(text: exception.message, status: 403)
      rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
        CartoDB.notify_exception(exception, { user: current_user, template_data: exception.template_data })
        render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
      rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
        CartoDB.notify_exception(exception)
        render_jsonp({ errors: { named_map: exception.message } }, 400)
      rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
        CartoDB.notify_exception(exception)
        render_jsonp({ errors: { named_maps: exception.message } }, 400)
      rescue => exception
        CartoDB.notify_exception(exception)
        raise exception
      end

      def list_watching
        return(head 403) unless @visualization.is_viewable_by_user?(current_user)
        watcher = CartoDB::Visualization::Watcher.new(current_user, @visualization)
        render_jsonp(watcher.list)
      end

      private

      def set_vizjson_response_headers_for(visualization)
        # We don't cache non-public vis
        if @visualization.is_publically_accesible?
          response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
          response.headers['Surrogate-Key'] = "#{CartoDB::SURROGATE_NAMESPACE_VIZJSON} #{visualization.surrogate_key}"
          response.headers['Cache-Control']   = 'no-cache,max-age=86400,must-revalidate, public'
        end
      end

      def to_json(visualization)
        ::JSON.dump(to_hash(visualization))
      end

      def to_hash(visualization)
        # TODO: previous controller uses public_fields_only option which I don't know if is still used
        VisualizationPresenter.new(visualization, current_viewer).to_poro
      end

    end
  end
end

module Carto
  module Api
    class ImportsController < ::Api::ApplicationController

      ssl_required :index, :show
      ssl_allowed :service_token_valid?, :list_files_for_service, :get_service_auth_url, :validate_service_oauth_code,
                  :service_oauth_callback

      def index
        imports = DataImportsService.new.process_recent_user_imports(current_user)
        render json: { imports: imports.map(&:id), success: true }
      end

      def show
        import = DataImportsService.new.process_by_id(params[:id])
        render_404 and return if import.nil?

        data = Carto::Api::DataImportPresenter.new(import).api_public_values
        if import.state == Carto::DataImport::STATE_COMPLETE
          data[:any_table_raster] = import.is_raster?

          decorate_twitter_import_data!(data, import)
          decorate_default_visualization_data!(data, import)
        end

        render json: data
      end

      def service_token_valid?
        valid = DataImportsService.new.validate_synchronization_oauth(uri_user, params[:id])
        render_jsonp({ oauth_valid: valid, success: true })
      rescue CartoDB::Datasources::TokenExpiredOrInvalidError => e
        CartoDB.notify_exception(e, { user: uri_user, params: params })
        render_jsonp({ errors: e.message }, 401)
      rescue => e
        CartoDB.notify_exception(e, { user: uri_user, params: params })
        render_jsonp({ errors: e.message }, 400)
      end

      def list_files_for_service
        filter = params[:filter].present? ? params[:filter] : []
        results = DataImportsService.new.get_service_files(uri_user, params[:id], filter)
        render_jsonp({ files: results, success: true })
      rescue CartoDB::Datasources::TokenExpiredOrInvalidError => e
        CartoDB.notify_exception(e, { user: uri_user, params: params })
        render_jsonp({ errors: e.message }, 401)
      rescue => e
        CartoDB.notify_exception(e, { user: uri_user, params: params })
        render_jsonp({ errors: { imports: e.message } }, 400)
      end

      def get_service_auth_url
        auth_url = DataImportsService.new.get_service_auth_url(uri_user, params[:id])
        render_jsonp({ url: auth_url, success: true})
      rescue CartoDB::Datasources::TokenExpiredOrInvalidError => e
        CartoDB.notify_exception(e, { user: uri_user, params: params })
        render_jsonp({ errors: e.message }, 401)
      rescue => e
        CartoDB.notify_exception(e, { user: uri_user, params: params })
        render_jsonp({ errors: { imports: e.message } }, 400)
      end

      def validate_service_oauth_code
        success = DataImportsService.new.validate_service_oauth_code(uri_user, params[:id], params[:code])
        render_jsonp({ success: success })
      rescue CartoDB::Datasources::TokenExpiredOrInvalidError => e
        CartoDB.notify_exception(e, { user: uri_user, params: params })
        render_jsonp({ errors: e.message }, 401)
      rescue => e
        CartoDB.notify_exception(e, { user: uri_user, params: params })
        render_jsonp({ errors: { imports: e.message } }, 400)
      end

      def service_oauth_callback
        DataImportsService.new.validate_callback(uri_user, params[:id], params)
        request.format = 'html'
        respond_to do |format|
          format.all  { render text: '<script>window.close();</script>', content_type: 'text/html' }
        end
      rescue CartoDB::Datasources::TokenExpiredOrInvalidError => e
        CartoDB::Logger.warning(message: "Expired oauth token", exception: e, user: uri_user, params: params)
        render text: 'Expired token. Try reconnecting<script>setTimeout(function(){window.close()}, 1000);</script>',
               content_type: 'text/html', status: 401
      rescue => e
        CartoDB::Logger.warning(message: "Error in oauth callback", exception: e, user: uri_user, params: params)
        render text: 'Connection failed<script>setTimeout(function(){window.close()}, 1000);</script>',
               content_type: 'text/html', status: 400
      end

      private

      # TODO: this should be moved upwards in the controller hierarchy, and make it a replacement for current_user
      def uri_user
        @uri_user ||= Carto::User.where(id: current_user.id).first
      end

      def decorate_twitter_import_data!(data, data_import)
        return if data_import.service_name != CartoDB::Datasources::Search::Twitter::DATASOURCE_NAME

        audit_entry = ::SearchTweet.where(data_import_id: data_import.id).first
        data[:tweets_georeferenced] = audit_entry.retrieved_items
        data[:tweets_cost] = audit_entry.price
        data[:tweets_overquota] = audit_entry.user.remaining_twitter_quota == 0
      end

      def decorate_default_visualization_data!(data, data_import)
        derived_vis_id = nil

        if data_import.create_visualization && !data_import.visualization_id.nil?
          derived_vis_id = data_import.visualization_id
        end

        data[:derived_visualization_id] = derived_vis_id
      end

    end
  end
end

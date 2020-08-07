module Carto
  module Api
    class GeocodingsController < ::Api::ApplicationController
      GEOCODING_SQLAPI_CALLS_TIMEOUT = 45

      ssl_required :index, :show, :available_geometries, :estimation_for

      def index
        # data_import_id is set for content guessing geocodes
        # TODO: agree on a more flexible API with params
        geocodings = Carto::Geocoding.where(
          "user_id = ? AND (state NOT IN (?)) AND (data_import_id IS NULL)",
          current_user.id, ['failed', 'finished', 'cancelled']
        ).all
        render json: { geocodings: geocodings }, root: false
      end

      def show
        geocoding = Carto::Geocoding.where(user_id: current_user.id, id: params[:id]).first
        raise RecordNotFound unless geocoding
        render json: geocoding.public_values
      end

      def available_geometries
        case params[:kind]
        when 'admin1'
          return render(json: ['polygon'])
        when 'namedplace'
          return render(json: ['point'])
        when 'postalcode'
          return available_geometries_for_postalcode
        else
          return head(400)
        end
      end

      def estimation_for
        table = get_table(params[:table_name])
        render_jsonp( { description: "table #{params[:table_name]} doesn't exist" }, 500) and return unless table

        force_all_rows   = (params[:force_all_rows].to_s == 'true')
        total_rows       = Carto::Geocoding.processable_rows(table, force_all_rows)
        remaining_quota  = uri_user.remaining_geocoding_quota
        remaining_quota  = (remaining_quota > 0 ? remaining_quota : 0)
        used_credits     = total_rows - remaining_quota
        used_credits     = (used_credits > 0 ? used_credits : 0)
        render json: {
          rows:       total_rows,
          estimation: (uri_user.geocoding_block_price.to_i * used_credits) / Carto::Geocoding::GEOCODING_BLOCK_SIZE
        }
      rescue StandardError => e
        CartoDB.notify_exception(e, params: params)
        render_jsonp( { description: e.message }, 500)
      end

      private

      # TODO: this should be moved upwards in the controller hierarchy, and make it a replacement for current_user
     def uri_user
       @uri_user ||= Carto::User.where(id: current_user.id).first
      end

      def available_geometries_for_postalcode
        return head(400) unless params[:free_text] || (params[:column_name] && params[:table_name])

        input = params[:free_text].present? ? clean_free_text_input([params[:free_text]]) : select_distinct_from_table_and_column(params[:table_name], params[:column_name])
        return head(400) if input.nil? && params[:table_name].present?
        render(json: []) and return if input.nil? || input.empty?

        list = input.map { |v| "'#{v.to_s.gsub("'", "''")}'" }.join(",")

        internal_geocoder_api_config = CartoDB::GeocoderConfig.instance.get['internal']
          .symbolize_keys
          .merge(timeout: GEOCODING_SQLAPI_CALLS_TIMEOUT)
        services = CartoDB::SQLApi.new(internal_geocoder_api_config)
          .fetch("SELECT (admin0_available_services(Array[#{list}])).*")

        geometries = []
        points = services.select { |s| s['postal_code_points'] }.size
        polygons = services.select { |s| s['postal_code_polygons'] }.size
        geometries.append 'point' if points > 0 && points >= polygons
        geometries.append 'polygon' if polygons > 0 && polygons >= points

        render(json: geometries)
      rescue StandardError => e
        CartoDB.notify_exception(e, params: params)
      end

      def clean_free_text_input(input)
        input.map{ |v| v.to_s.squish.downcase.gsub(/[^\p{Alnum}]/, '') }.reject(&:blank?)
      end

      def select_distinct_from_table_and_column(table_name, column_name)
        table = get_table(table_name)
        return nil if table.nil?
        input = table.sequel.distinct.select_map(params[:column_name].to_sym)
      end

      def get_table(table_name)
        Carto::Helpers::TableLocator.new.get_by_id_or_name(table_name, uri_user).try(&:service)
      end

    end
  end
end

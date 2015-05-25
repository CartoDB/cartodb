#encoding: UTF-8

module Carto
  module Api
    class GeocodingsController < ::Api::ApplicationController
      GEOCODING_SQLAPI_CALLS_TIMEOUT = 45

      ssl_required :available_geometries, :country_data_for, :estimation_for, :get_countries

      def index
        geocodings = Carto::Geocoding.where("user_id = ? AND (state NOT IN (?))", current_user.id, ['failed', 'finished', 'cancelled']).all
        render json: { geocodings: geocodings }, root: false
      end

      def show
        geocoding = Carto::Geocoding.where(user_id: current_user.id, id: params[:id]).first
        raise RecordNotFound unless geocoding
        render json: geocoding.public_values
      end

      def country_data_for
        response = { admin1: ["polygon"], namedplace: ["point"] }
        rows     = CartoDB::SQLApi.new({
                                         username: 'geocoding',
                                         timeout: GEOCODING_SQLAPI_CALLS_TIMEOUT
                                       })
                     .fetch("SELECT service FROM postal_code_coverage WHERE iso3 = (SELECT iso3 FROM country_decoder WHERE name = '#{params[:country_code]}')")
                     .map { |i| i['service'] }
        response[:postalcode] = rows if rows.size > 0

        render json: response
      end

      def get_countries
        rows = CartoDB::SQLApi.new(
          Cartodb.config[:geocoder]["internal"].symbolize_keys
                                               .merge({timeout: GEOCODING_SQLAPI_CALLS_TIMEOUT})
        )
          .fetch("SELECT distinct(pol.name) iso3, pol.name FROM country_decoder pol ORDER BY pol.name ASC")
        render json: rows
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
        total_rows       = Carto::Geocoding.processable_rows(table)
        remaining_quota  = logged_user.remaining_geocoding_quota
        remaining_quota  = (remaining_quota > 0 ? remaining_quota : 0)
        used_credits     = total_rows - remaining_quota
        used_credits     = (used_credits > 0 ? used_credits : 0)
        render json: {
          rows:       total_rows,
          estimation: (logged_user.geocoding_block_price.to_i * used_credits) / Carto::User::GEOCODING_BLOCK_SIZE.to_f
        }
      rescue => e
        CartoDB.notify_exception(e, params: params)
        render_jsonp( { description: e.message }, 500)
      end

      private

      # TODO: this should be moved upwards in the controller hierarchy, and make it a replacement for current_user
     def logged_user
       @logged_user ||= Carto::User.where(id: current_user.id).first
      end

      def available_geometries_for_postalcode
        return head(400) unless params[:free_text] || (params[:column_name] && params[:table_name])

        input = params[:free_text].present? ? clean_free_text_input([params[:free_text]]) : select_distinct_from_table_and_column(params[:table_name], params[:column_name])
        return head(400) if input.nil? && params[:table_name].present?
        render(json: []) and return if input.nil? || input.empty?

        list = input.map{ |v| "'#{ v }'" }.join(",")

        services = CartoDB::SQLApi.new({ username: 'geocoding', timeout: GEOCODING_SQLAPI_CALLS_TIMEOUT}).fetch("SELECT (admin0_available_services(Array[#{list}])).*")

        geometries = []
        points = services.select { |s| s['postal_code_points'] }.size
        polygons = services.select { |s| s['postal_code_polygons'] }.size
        geometries.append 'point' if points > 0 && points >= polygons
        geometries.append 'polygon' if polygons > 0 && polygons >= points

        render(json: geometries || [])
      rescue => e
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
        Helpers::TableLocator.new.get_by_id_or_name(table_name, current_user)
      end

    end
  end
end

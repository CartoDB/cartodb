#encoding: UTF-8
require Rails.root.join('services', 'sql-api', 'sql_api')

class Api::Json::GeocodingsController < Api::ApplicationController
  ssl_required :create, :update

  before_filter :load_table, only: [:create, :estimation_for]

  # In seconds
  GEOCODING_SQLAPI_CALLS_TIMEOUT = 45

  def update
    @stats_aggregator.timing('geocodings.update') do

      begin
        geocoding = current_user.geocodings_dataset.where(id: params[:id]).first
        return head(401) unless geocoding && params[:state] == 'cancelled'
        @stats_aggregator.timing('save') do
          geocoding.cancel
        end
        render_jsonp(geocoding.reload)
      rescue => e
        render_jsonp({ errors: e.message }, 400)
      end

    end
  end

  def create
    @stats_aggregator.timing('geocodings.create') do

      begin
        geocoding  = Geocoding.new params.slice(:kind, :geometry_type, :formatter, :country_code, :region_code)
        geocoding.user = current_user
        geocoding.table_id = @table.try(:id)
        geocoding.table_name = params[:table_name] ? params[:table_name] : @table.try(:name)
        geocoding.raise_on_save_failure = true
        geocoding.force_all_rows = (params[:force_all_rows].to_s == 'true')

        geocoding.formatter = "{#{ params[:column_name] }}" if params[:column_name].present?

        geocoding = @stats_aggregator.timing('special-params') do
          # TODO api should be more regular
          unless ['high-resolution', 'ipaddress'].include? params[:kind] then
            if params[:text]
              countries = [params[:location]]
            else
              countries = @table.sequel.distinct.select_map(params[:location].to_sym)
              geocoding.country_column = params[:location]
            end
            geocoding.country_code = countries.map{|c| "'#{ c }'"}.join(',')

            if params[:region]
              if params[:region_text]
                regions = [params[:region]]
              else
                regions = @table.sequel.distinct.select_map(params[:region].to_sym)
                geocoding.region_column = params[:region]
              end
              geocoding.region_code = regions.map{|r| "'#{ r }'"}.join(',')
            end
          end
          geocoding
        end

        geocoding = @stats_aggregator.timing('save') do
          geocoding.save
          geocoding
        end

        @table.automatic_geocoding.destroy if @table.automatic_geocoding.present?
        Resque.enqueue(Resque::GeocoderJobs, job_id: geocoding.id)

        render_jsonp(geocoding.to_json)
      rescue Sequel::ValidationFailed => e
        CartoDB.notify_exception(e)
        render_jsonp( { description: e.message }, 422)
      rescue => e
        CartoDB.notify_exception(e)
        render_jsonp( { description: e.message }, 500)
      end

    end
  end

  protected

  def load_table
    @table = Helpers::TableLocator.new.get_by_id_or_name(params.fetch('table_name'), current_user)
  end
end

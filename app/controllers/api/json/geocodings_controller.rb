#encoding: UTF-8
require Rails.root.join('services', 'sql-api', 'sql_api')

class Api::Json::GeocodingsController < Api::ApplicationController
  ssl_required :index, :show, :create, :update

  def index
    geocodings = Geocoding.where("user_id = ? AND (state NOT IN ?)", current_user.id, ['failed', 'finished', 'cancelled'])
    render json: { geocodings: geocodings }
  end

  def show
    geocoding = current_user.geocodings_dataset.where(id: params[:id]).first
    raise RecordNotFound unless geocoding
    render json: geocoding
  end

  def update
    geocoding = current_user.geocodings_dataset.where(id: params[:id]).first
    return head(401) unless geocoding && params[:state] == 'cancelled'
    geocoding.update(state: 'cancelled')
    render_jsonp(geocoding.reload)
  rescue => e
    render_jsonp({ errors: e.message }, 400)
  end

  def create
    table     = current_user.tables.where(name: params[:table_name]).first
    geocoding = Geocoding.new params.slice(:kind, :geometry_type, :formatter, :country_code)
    geocoding.formatter = params[:column_name] if params[:column_name].present?
    geocoding.user      = current_user
    geocoding.table_id  = table.try(:id)
    geocoding.raise_on_save_failure = true
    geocoding.save

    table.automatic_geocoding.destroy if table.automatic_geocoding.present?
    Resque.enqueue(Resque::GeocoderJobs, job_id: geocoding.id)

    render_jsonp(geocoding.to_json)
  rescue Sequel::ValidationFailed => e
    render_jsonp( { description: e.message }, 422)
  rescue => e
    render_jsonp( { description: e.message }, 500)
  end

  def country_data_for
    rows = CartoDB::SQLApi.new(username: 'geocoding')
            .fetch("SELECT service, type FROM available_services WHERE iso3 = '#{params[:country_code]}'")
    rows = Hash[rows.group_by {|d| d["service"]}.collect {|k,v| [k, v.map {|va| va["type"]}]}]
    render json: rows
  end

  def get_countries
    rows = CartoDB::SQLApi.new(Cartodb.config[:geocoder]["internal"].symbolize_keys)
            .fetch("SELECT distinct(serv.iso3), pol.name FROM available_services serv, global_admin0_polygons pol WHERE pol.iso3 = serv.iso3 ORDER BY serv.iso3 DESC")

    render json: rows
  end
end

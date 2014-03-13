#encoding: UTF-8
require Rails.root.join('services', 'sql-api', 'sql_api')

class Api::Json::GeocodingsController < Api::ApplicationController
  ssl_required :index, :show, :create, :update, :country_data_for, :get_countries

  def index
    geocodings = Geocoding.where("user_id = ? AND (state NOT IN ?)", current_user.id, ['failed', 'finished', 'cancelled'])
    render json: { geocodings: geocodings }
  end

  def show
    geocoding = current_user.geocodings_dataset.where(id: params[:id]).first
    raise RecordNotFound unless geocoding
    render json: geocoding.public_values
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
    geocoding.formatter = "{#{params[:column_name]}}" if params[:column_name].present?
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
    response = { admin1: ["polygon"], namedplace: ["point"] }
    rows     = CartoDB::SQLApi.new(username: 'geocoding')
                 .fetch("SELECT service FROM postal_code_coverage WHERE iso3 = (SELECT iso3 FROM country_decoder WHERE name = '#{params[:country_code]}')")
                 .map { |i| i['service'] }
    response[:postalcode] = rows if rows.size > 0

    render json: response
  end

  def get_countries
    rows = CartoDB::SQLApi.new(Cartodb.config[:geocoder]["internal"].symbolize_keys)
            .fetch("SELECT distinct(pol.name) iso3, pol.name FROM country_decoder pol ORDER BY pol.name ASC")
    render json: rows
  end
end

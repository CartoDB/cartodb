#encoding: UTF-8
require Rails.root.join('services', 'sql-api', 'sql_api')

class Api::Json::GeocodingsController < Api::ApplicationController
  ssl_required :index, :show, :create, :update, :country_data_for, :get_countries, :estimation_for, :available_geometries unless Rails.env.development?

  before_filter :load_table, only: [:create, :estimation_for]

  # In seconds
  GEOCODING_SQLAPI_CALLS_TIMEOUT = 45

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
    geocoding          = Geocoding.new params.slice(:kind, :geometry_type, :formatter, :country_code)
    geocoding.user     = current_user
    geocoding.table_id = @table.try(:id)
    geocoding.raise_on_save_failure = true

    geocoding.formatter = "{#{ params[:column_name] }}" if params[:column_name].present?

    # TODO api should be more regular
    unless ['high-resolution', 'ipaddress'].include? params[:kind] then
      countries = params[:text] ? [params[:location]] : @table.sequel.distinct.select_map(params[:location].to_sym)
      geocoding.country_code = countries.map{ |c| "'#{ c }'"}.join(',')
      geocoding.country_column = params[:location] if params[:text] == false
    end

    geocoding.save

    @table.automatic_geocoding.destroy if @table.automatic_geocoding.present?
    Resque.enqueue(Resque::GeocoderJobs, job_id: geocoding.id)

    render_jsonp(geocoding.to_json)
  rescue Sequel::ValidationFailed => e
    render_jsonp( { description: e.message }, 422)
  rescue => e
    render_jsonp( { description: e.message }, 500)
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
    return head(400) unless %w(admin1 namedplace postalcode).include? params[:kind]

    render(json: ["polygon"]) and return if params[:kind] == "admin1"
    render(json: ["point"])   and return if params[:kind] == "namedplace"

    return head(400) unless params[:free_text] || (params[:column_name] && params[:table_name])

    if params[:free_text]
      input = [params[:free_text]]
    else
      begin
        load_table
        return head(400) if @table.nil?
        input = @table.sequel.distinct.select_map(params[:column_name].to_sym)
      rescue Sequel::DatabaseError => e
        Rollbar.report_exception(e)
        render(json: []) and return
      end
    end

    input = input.map{ |v| v.to_s.squish.downcase.gsub(/[^\p{Alnum}]/, '') }
            .reject(&:blank?)

    render(json: []) and return if input.empty?

    list = input.map{ |v| "'#{ v }'" }.join(",")

    services = CartoDB::SQLApi.new({
                                     username: 'geocoding',
                                     timeout: GEOCODING_SQLAPI_CALLS_TIMEOUT
                                   })
                              .fetch("SELECT (admin0_available_services(Array[#{list}])).*")

    geometries = []
    points = services.select { |s| s['postal_code_points'] }.size
    polygons = services.select { |s| s['postal_code_polygons'] }.size
    geometries.append 'point' if points > 0 && points >= polygons
    geometries.append 'polygon' if polygons > 0 && polygons >= points

    render(json: geometries || [])
  end

  def estimation_for
    total_rows       = Geocoding.processable_rows(@table)
    remaining_quota  = current_user.geocoding_quota - current_user.get_geocoding_calls
    remaining_quota  = (remaining_quota > 0 ? remaining_quota : 0)
    used_credits     = total_rows - remaining_quota
    used_credits     = (used_credits > 0 ? used_credits : 0)
    render json: {
      rows:       total_rows,
      estimation: (current_user.geocoding_block_price.to_i * used_credits) / User::GEOCODING_BLOCK_SIZE.to_f
    }
  rescue => e
    CartoDB.notify_exception(e)
    render_jsonp( { description: e.message }, 500)
  end

  protected

  def load_table
    @table = ::Table.get_by_id_or_name(params.fetch('table_name'), current_user)
  end
end

#encoding: UTF-8
require Rails.root.join('services', 'sql-api', 'sql_api')

class Api::Json::GeocodingsController < Api::ApplicationController
  ssl_required :index, :show, :create, :update, :estimation_for, :available_geometries unless Rails.env.development?

  before_filter :load_table, only: [:create, :estimation_for]

  # In seconds
  GEOCODING_SQLAPI_CALLS_TIMEOUT = 45

  def index
    geocodings = Geocoding.where("user_id = ? AND (state NOT IN ?) AND (data_import_id IS NULL)", current_user.id,
                                 ['failed', 'finished', 'cancelled'])
    render json: { geocodings: geocodings }
  end

  def show
    geocoding = current_user.geocodings_dataset.where(id: params[:id]).first
    raise RecordNotFound unless geocoding
    render json: geocoding.public_values
  end

  def update
    @stats_aggregator.timing('geocodings.update') do

      begin
        geocoding = current_user.geocodings_dataset.where(id: params[:id]).first
        return head(401) unless geocoding && params[:state] == 'cancelled'
        @stats_aggregator.timing('save') do
          geocoding.update(state: 'cancelled')
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
    force_all_rows = (params[:force_all_rows].to_s == 'true')
    total_rows = Geocoding.processable_rows(@table, force_all_rows)
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
    @table = Helpers::TableLocator.new.get_by_id_or_name(params.fetch('table_name'), current_user)
  end
end

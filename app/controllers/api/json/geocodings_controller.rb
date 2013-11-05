#encoding: UTF-8
class Api::Json::GeocodingsController < Api::ApplicationController
  ssl_required :index, :show, :create, :update

  def index
    geocodings = Geocoding.where("user_id = ? AND (state NOT IN ?)", current_user.id, ['failed', 'finished', 'cancelled'])
    render json: { geocodings: geocodings }
  end

  def show
    geocoding = Geocoding[params[:id]]
    render json: geocoding
  end

  def update
    geocoding = Geocoding[params[:id]]
    return head(401) unless geocoding && params[:state] == 'cancelled'
    geocoding.update(state: 'cancelled')
    render_jsonp(geocoding.reload)
  rescue => e
    render_jsonp({ errors: e.message }, 400)
  end

  def create
    options = { 
      user_id:     current_user.id,
      table_name:  params[:table_name].presence,
      formatter:   params[:formatter].presence
    }
      
    geocoding = Geocoding.create(options)
    Resque.enqueue(Resque::GeocoderJobs, job_id: geocoding.id)

    render_jsonp(geocoding.to_json)
  rescue Sequel::ValidationFailed => e
    render_jsonp( { description: e.message }, 422)
  end
end

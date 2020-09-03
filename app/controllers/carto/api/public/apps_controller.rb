require_relative '../visualization_searcher'
require_relative '../paged_searcher'

class Carto::Api::Public::AppsController < Carto::Api::Public::ApplicationController
  include Carto::Api::VisualizationSearcher
  include Carto::Api::PagedSearcher

  CONTENT_LENGTH_LIMIT_IN_BYTES = 10 * 1024 * 1024 # 10MB
  VALID_ORDER_PARAMS = %i(name updated_at privacy).freeze
  ALLOWED_PRIVACY_MODES = [
    Carto::Visualization::PRIVACY_PUBLIC,
    Carto::Visualization::PRIVACY_PROTECTED
  ].freeze

  ssl_required

  before_action :check_master_api_key
  before_action :validate_mandatory_creation_params, only: [:create]
  before_action :validate_input_parameters, only: [:create, :update]
  before_action :get_app, only: [:update, :delete]
  before_action :get_user, only: [:create, :update, :delete]
  before_action :check_edition_permission, only: [:update, :delete]

  rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

  def index
    opts = { valid_order_combinations: VALID_ORDER_PARAMS }
    page, per_page, order, order_direction = page_per_page_order_params(VALID_ORDER_PARAMS, opts)
    params[:type] = Carto::Visualization::TYPE_APP
    vqb = query_builder_with_filter_from_hash(params)

    apps = vqb.with_order(order, order_direction).build_paged(page, per_page).map do |v|
      Carto::Api::Public::AppPresenter.new(self, v.user, v).to_hash
    end
    response = {
      apps: apps,
      total_entries: vqb.count
    }
    render_jsonp(response)
  rescue Carto::ParamInvalidError => e
    log_error(exception: e)
    render_jsonp({ error: e.message }, 400)
  rescue StandardError => e
    log_error(exception: e)
    render_jsonp({ error: e.message }, 500)
  end

  def create
    app = create_visualization_metadata(@logged_user)
    asset = Carto::Asset.for_visualization(visualization: app,
                                           resource: StringIO.new(Base64.decode64(params[:data])))
    asset.save
    # Carto::Tracking::Events::CreatedMap.new(@logged_user.id, event_properties(app).merge(origin: 'custom')).report

    render_jsonp(Carto::Api::Public::AppPresenter.new(self, @logged_user, app).to_hash, 200)
  rescue ActiveRecord::RecordInvalid => e
    log_error(message: 'Error creating app', params: params, exception: e)
    render_jsonp({ error: e.message }, 400)
  rescue StandardError => e
    log_error(message: 'Error creating app', params: params, exception: e)
    render_jsonp({ error: 'The app can not be created' }, 500)
  end

  def update
    @app.update_attributes!(params.permit(:name, :privacy, :password))

    if params[:data].present?
      @app.asset.update_visualization_resource(StringIO.new(Base64.decode64(params[:data])))
      # In case we only update the asset we need to invalidate the visualization
      @app.save
    end
    # Carto::Tracking::Events::ModifiedMap.new(@logged_user.id, event_properties(@app)).report

    render_jsonp(Carto::Api::Public::AppPresenter.new(self, @logged_user, @app).to_hash, 200)
  rescue ActiveRecord::RecordInvalid => e
    render_jsonp({ error: e.message }, 400)
  end

  def delete
    # Carto::Tracking::Events::DeletedMap.new(@logged_user.id, event_properties(@app)).report
    @app.destroy
    head 204
  rescue StandardError => e
    log_error(message: 'Error deleting app', exception: e, visualization: @app)
    render_jsonp({ errors: [e.message] }, 400)
  end

  private

  def create_visualization_metadata(user)
    app = Carto::Visualization.new
    app.name = params[:name]
    app.privacy = params[:password].present? ? Carto::Visualization::PRIVACY_PROTECTED : Carto::Visualization::PRIVACY_PUBLIC
    app.password = params[:password]
    app.type = Carto::Visualization::TYPE_APP
    app.user = user
    app.save!
    app
  end

  # def event_properties(app)
  #   {
  #     user_id: @logged_user.id,
  #     app_id: app.id
  #   }
  # end

  def get_user
    @logged_user = current_viewer.present? ? Carto::User.find(current_viewer.id) : nil
  end

  def check_master_api_key
    api_key = Carto::ApiKey.find_by_token(params["api_key"])
    raise Carto::UnauthorizedError unless api_key&.master?
  end

  def check_edition_permission
    head(403) unless @app.has_permission?(@logged_user, Carto::Permission::ACCESS_READWRITE)
  end

  def validate_input_parameters
    if request.content_length > CONTENT_LENGTH_LIMIT_IN_BYTES
      return render_jsonp({ error: "Visualization over the size limit (#{CONTENT_LENGTH_LIMIT_IN_BYTES / 1024 / 1024}MB)" }, 400)
    end

    if params[:privacy].present?
      unless ALLOWED_PRIVACY_MODES.include?(params[:privacy])
        return render_jsonp({ error: "privacy mode not allowed. Allowed ones are #{ALLOWED_PRIVACY_MODES}" }, 400)
      end
      if params[:privacy] == Carto::Visualization::PRIVACY_PROTECTED && !params[:password].present?
        return render_jsonp({ error: 'Changing privacy to protected should come along with the password param' }, 400)
      end
    end

    if params[:data].present?
      begin
        decoded_data = Base64.strict_decode64(params[:data])
        return render_jsonp({ error: 'data parameter must be HTML' }, 400) unless html_param?(decoded_data)
      rescue ArgumentError
        return render_jsonp({ error: 'data parameter must be encoded in base64' }, 400)
      end
    end
  end

  def validate_mandatory_creation_params
    if !params[:data].present?
      render_jsonp({ error: 'missing data parameter' }, 400)
    elsif !params[:name].present?
      render_jsonp({ error: 'missing name parameter' }, 400)
    end
  end

  def html_param?(data)
    # FIXME this is a very naive implementantion. I'm trying to use
    # Nokogiri to validate the HTML but it doesn't works as I want
    # so
    data.match(/\<html.*\>/).present?
  end

  def get_app
    @app = Carto::Visualization.find(params[:id])
    if @app.nil?
      raise Carto::LoadError.new('App doesn\'t exist', 404)
    end
  end
end

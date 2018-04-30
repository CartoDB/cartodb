require_relative 'paged_searcher'

class Carto::Api::ApiKeysController < ::Api::ApplicationController
  include Carto::ControllerHelper
  include Carto::UUIDHelper
  include Carto::Api::PagedSearcher
  include Carto::Api::AuthApiAuthentication

  ssl_required :create, :destroy, :regenerate_token, :show, :index

  before_filter :any_api_authorization_required, only: [:index, :show]
  skip_filter :api_authorization_required, only: [:index, :show]
  before_filter :check_feature_flag
  before_filter :check_engine_enabled
  before_filter :load_api_key, only: [:destroy, :regenerate_token, :show]

  rescue_from Carto::OrderParamInvalidError, with: :rescue_from_carto_error
  rescue_from Carto::LoadError, with: :rescue_from_carto_error
  rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error
  rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

  VALID_ORDER_PARAMS = [:type, :name, :updated_at].freeze

  def create
    carto_viewer = Carto::User.find(current_viewer.id)
    api_key = carto_viewer.api_keys.create_regular_key!(name: params[:name], grants: params[:grants])
    render_jsonp(Carto::Api::ApiKeyPresenter.new(api_key).to_poro, 201)
  rescue ActiveRecord::RecordInvalid => e
    raise Carto::UnprocesableEntityError.new(e.message)
  end

  def destroy
    raise Carto::UnauthorizedError.new unless @viewed_api_key.can_be_deleted?

    @viewed_api_key.destroy
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@viewed_api_key).to_poro, 200)
  end

  def regenerate_token
    @viewed_api_key.regenerate_token!
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@viewed_api_key).to_poro, 200)
  end

  def index
    page, per_page, order = page_per_page_order_params(VALID_ORDER_PARAMS)

    api_keys = Carto::User.find(current_viewer.id).api_keys
    api_keys = request_api_key.master? ? api_keys : api_keys.where(id: request_api_key.id)
    filtered_api_keys = Carto::PagedModel.paged_association(api_keys, page, per_page, order)

    result = filtered_api_keys.map { |api_key| json_for_api_key(api_key) }

    render_jsonp(
      paged_result(
        result: result,
        total_count: api_keys.count,
        page: page,
        per_page: per_page,
        order: order
      ) { |params| api_keys_url(params) },
      200
    )
  end

  def show
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@viewed_api_key).to_poro, 200)
  end

  private

  def check_feature_flag
    render_404 unless current_viewer.try(:has_feature_flag?, 'auth_api')
  end

  def check_engine_enabled
    render_404 unless current_viewer.try(:engine_enabled?)
  end

  def load_api_key
    name = params[:id]
    @viewed_api_key = Carto::ApiKey.where(user_id: current_viewer.id, name: name).first
    if !@viewed_api_key || !request_api_key.master? && @viewed_api_key != request_api_key
      raise Carto::LoadError.new("API key not found: #{name}")
    end
  end

  def json_for_api_key(api_key)
    Carto::Api::ApiKeyPresenter.new(api_key).to_poro.merge(
      _links: {
        self: api_key_url(id: CGI::escape(api_key.name))
      }
    )
  end
end

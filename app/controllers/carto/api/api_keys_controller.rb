require_relative 'paged_searcher'

class Carto::Api::ApiKeysController < ::Api::ApplicationController
  include Carto::UUIDHelper
  include Carto::Api::PagedSearcher
  include Carto::Api::AuthApiAuthentication

  ssl_required :create, :destroy, :regenerate_token, :show, :index

  before_filter :any_api_authorization_required, only: [:index, :show]
  skip_filter :api_authorization_required, only: [:index, :show]
  before_filter :engine_required
  before_filter :load_api_key, only: [:destroy, :regenerate_token, :show]

  rescue_from Carto::ParamInvalidError, with: :rescue_from_carto_error
  rescue_from Carto::LoadError, with: :rescue_from_carto_error
  rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error
  rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
  rescue_from Carto::CartoError, with: :rescue_from_carto_error

  VALID_ORDER_PARAMS = [:type, :name, :updated_at].freeze
  VALID_TYPE_PARAMS = [Carto::ApiKey::TYPE_MASTER,
                       Carto::ApiKey::TYPE_DEFAULT_PUBLIC,
                       Carto::ApiKey::TYPE_REGULAR].freeze

  def create
    api_key = target_user.api_keys.create_regular_key!(name: params[:name], grants: params[:grants])
    render_jsonp(Carto::Api::ApiKeyPresenter.new(api_key).to_poro, 201)
  rescue ActiveRecord::RecordInvalid => e
    raise Carto::UnprocesableEntityError.new(e.message)
  rescue CartoDB::QuotaExceeded => e
    raise Carto::CartoError.new(e.message, 403)
  end

  def destroy
    raise Carto::UnauthorizedError.new unless @viewed_api_key.can_be_deleted?

    @viewed_api_key.destroy
    head :no_content
  end

  def regenerate_token
    @viewed_api_key.regenerate_token!
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@viewed_api_key).to_poro, 200)
  end

  def index
    page, per_page, order, _order_direction = page_per_page_order_params(VALID_ORDER_PARAMS)

    api_keys = target_user.api_keys.by_type(type_param).order_weighted_by_type
    api_keys = request_api_key.master? ? api_keys : api_keys.where(id: request_api_key.id)
    filtered_api_keys = Carto::PagedModel.paged_association(api_keys, page, per_page, order)

    result = filtered_api_keys.map { |api_key| json_for_api_key(api_key) }

    render_jsonp(
      paged_result(
        result: result,
        total_count: api_keys.count,
        page: page,
        per_page: per_page,
        params: params
      ) { |params| api_keys_url(params) },
      200
    )
  end

  def show
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@viewed_api_key).to_poro, 200)
  end

  private

  def load_api_key
    name = params[:id]
    @viewed_api_key = Carto::ApiKey.where(user_id: target_user.id, name: name).user_visible.first
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

  def type_param
    types = (params[:type] || '').split(',').map(&:strip)
    raise Carto::ParamInvalidError.new(:type, VALID_TYPE_PARAMS) unless (types - VALID_TYPE_PARAMS).empty?
    types
  end

  def target_user
    if params[:target_user].nil?
      current_viewer
    else
      # just org owners or org admins can manage api keys for other users
      raise Carto::UnauthorizedError.new unless current_viewer.organization_admin?
      user = Carto::User.where(username: params[:target_user], organization: current_viewer.organization.id).first
      raise Carto::LoadError.new("User '#{params[:target_user]}' not found in the organization '#{current_viewer.organization.name}'") if user.nil?
      user
    end
  end
end

require_relative 'paged_searcher'

class Carto::Api::ApiKeysController < ::Api::ApplicationController
  include Carto::ControllerHelper
  include Carto::UUIDHelper
  include Carto::Api::PagedSearcher

  ssl_required :create, :destroy, :regenerate_token, :show, :index

  before_filter :api_authorization_required
  before_filter :check_feature_flag
  before_filter :load_api_key, only: [:destroy, :regenerate_token, :show]

  rescue_from Carto::LoadError, with: :rescue_from_carto_error
  rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error

  def create
    api_key = Carto::ApiKey.create!(
      user_id: current_viewer.id,
      type: Carto::ApiKey::TYPE_REGULAR,
      name: params[:name],
      grants: params[:grants]
    )
    render_jsonp(Carto::Api::ApiKeyPresenter.new(api_key).to_poro, 201)
  rescue ActiveRecord::RecordInvalid => e
    raise Carto::UnprocesableEntityError.new(e.message)
  end

  def destroy
    @api_key.destroy
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@api_key).to_poro, 200)
  end

  def regenerate_token
    @api_key.create_token
    @api_key.save!
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@api_key).to_poro, 200)
  end

  def index
    page, per_page, order = page_per_page_order_params

    api_keys = Carto::User.find(current_viewer.id).api_keys
    filtered_api_keys = api_keys.limit(per_page).offset((page - 1) * per_page).order(order)

    result = filtered_api_keys.map { |api_key| json_for_api_key(api_key) }

    last_page = (api_keys.count / per_page.to_f).ceil

    args = { result: result, last_page: last_page, total_count: api_keys.count }
    result = paged_result(args) { |params| api_keys_url(params) }

    render_jsonp(result, 200)
  end

  def show
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@api_key).to_poro, 200)
  end

  private

  def check_feature_flag
    render_404 unless current_viewer.try(:has_feature_flag?, 'auth_api')
  end

  def load_api_key
    id = params[:id]
    if !is_uuid?(id) || !(@api_key = Carto::ApiKey.where(id: id).where(user_id: current_viewer.id).first)
      raise Carto::LoadError.new("API key not found: #{id}")
    end
  end

  def json_for_api_key(api_key)
    Carto::Api::ApiKeyPresenter.new(api_key).to_poro.merge(
      _links: {
        self: api_key_url(id: api_key.id)
      }
    )
  end
end

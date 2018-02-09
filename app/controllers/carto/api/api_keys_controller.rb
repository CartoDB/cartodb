require_relative 'paged_searcher'

class Carto::Api::ApiKeysController < ::Api::ApplicationController
  include Carto::ControllerHelper
  include Carto::UUIDHelper
  include Carto::Api::PagedSearcher

  ssl_required :create, :destroy, :regenerate_token, :show, :index

  before_filter :api_authorization_required
  before_filter :check_feature_flag
  before_filter :load_api_key, only: [:destroy, :regenerate_token, :show]
  before_filter :fix_grants_deep_munge # Can be removed in Rails 5 (https://github.com/rails/rails/pull/12251)

  rescue_from Carto::LoadError, with: :rescue_from_carto_error
  rescue_from Carto::UnprocesableEntityError, with: :rescue_from_carto_error
  rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

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
    raise Carto::UnauthorizedError.new if @api_key.master?

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
    render_jsonp(Carto::Api::ApiKeyPresenter.new(@api_key).to_poro, 200)
  end

  private

  def fix_grants_deep_munge
    grants = params[:grants]
    return unless grants

    # deep_munge converts empty array to nil. Undo it
    grants.each do |g|
      if g[:type] == 'apis' && g.has_key?(:apis) && g[:apis].nil?
        g[:apis] = []
      elsif g[:type] == 'database'
        if g.has_key?(:tables) && g[:tables].nil?
          g[:tables] = []
        else
          g[:tables].each { |t| t[:permissions] = [] if t.has_key?(:permissions) && t[:permissions].nil? }
        end
      end
    end
    rescue
      # Invalid JSON (e.g: string instead of array), will get caught by validator down the line
  end

  def check_feature_flag
    render_404 unless current_viewer.try(:has_feature_flag?, 'auth_api')
  end

  def load_api_key
    name = params[:id]
    if !(@api_key = Carto::ApiKey.where(user_id: current_viewer.id).where(name: name).first)
      raise Carto::LoadError.new("API key not found: #{name}")
    end
  end

  def json_for_api_key(api_key)
    Carto::Api::ApiKeyPresenter.new(api_key).to_poro.merge(
      _links: {
        self: api_key_url(id: api_key.name)
      }
    )
  end
end

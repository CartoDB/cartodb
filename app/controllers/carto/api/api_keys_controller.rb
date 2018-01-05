require_relative 'paged_searcher'

class Carto::Api::ApiKeysController < ::Api::ApplicationController
  include Carto::ControllerHelper
  include Carto::UUIDHelper
  include Carto::Api::PagedSearcher

  ssl_required :create, :destroy

  before_filter :api_authorization_required
  before_filter :check_feature_flag
  before_filter :load_api_key, only: [:destroy, :show]

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

  def index
    result = []
    page, per_page, order = page_per_page_order_params

    api_keys = Carto::User.find(current_viewer.id).api_keys
    api_keys.limit(per_page).offset((page - 1) * per_page).order(order).each do |api_key|
      result << api_key_links(api_key)
    end

    last_page = (api_keys.count / per_page.to_f).ceil

    metadata = metadata_with_first_page(api_keys.count, result.count)

    metadata[:_links][:prev] = prev_page_link if page > 1
    metadata[:_links][:next] = next_page_link if last_page > page
    metadata[:_links][:last] = last_page_link(last_page)

    metadata[:result] = result

    render_jsonp(metadata,200)
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

  def metadata_with_first_page(api_keys_count, total_count)
    _, per_page, order = page_per_page_order_params
    {
      total: api_keys_count,
      count: total_count,
      _links: {
        first: {
          href: api_keys_url(page: 1, per_page: per_page, order: order)
        }
      }
    }
  end

  def api_key_links(api_key)
    {
      id: api_key.id,
      _links: {
        self: api_key_url(id: api_key.id)
      }
    }
  end

  def next_page_link
    page, per_page, order = page_per_page_order_params
    { href: api_keys_url(page: page + 1, per_page: per_page, order: order) }
  end

  def last_page_link(last_page)
    _, per_page, order = page_per_page_order_params
    { href: api_keys_url(page: last_page, per_page: per_page, order: order) }
  end

  def prev_page_link
    page, per_page, order = page_per_page_order_params
    { href: api_keys_url(page: page - 1, per_page: per_page, order: order) }
  end
end

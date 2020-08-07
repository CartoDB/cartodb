require_relative '../visualization_searcher'
require_relative '../paged_searcher'

class Carto::Api::Public::CustomVisualizationsController < Carto::Api::Public::ApplicationController
  include Carto::Api::VisualizationSearcher
  include Carto::Api::PagedSearcher

  CONTENT_LENGTH_LIMIT_IN_BYTES = 10 * 1024 * 1024 # 10MB
  VALID_ORDER_PARAMS = %i(name updated_at privacy).freeze
  ALLOWED_PRIVACY_MODES = [
    Carto::Visualization::PRIVACY_PUBLIC,
    Carto::Visualization::PRIVACY_PROTECTED
  ].freeze

  IF_EXISTS_FAIL = 'fail'.freeze
  IF_EXISTS_REPLACE = 'replace'.freeze
  VALID_IF_EXISTS = [IF_EXISTS_FAIL, IF_EXISTS_REPLACE].freeze

  ssl_required

  before_action :check_master_api_key
  before_action :validate_mandatory_creation_params, only: [:create]
  before_action :validate_input_parameters, only: [:create, :update]
  before_action :get_kuviz, only: [:update, :delete]
  before_action :get_user, only: [:create, :update, :delete]
  before_action :check_public_map_quota, only: [:create]
  before_action :check_edition_permission, only: [:update, :delete]
  before_action :validate_if_exists, only: [:create, :update]
  before_action :get_last_one, only: [:create]
  before_action :remove_duplicates, only: [:create, :update]

  rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
  rescue_from Carto::ParamInvalidError, with: :rescue_from_carto_error
  rescue_from Carto::QuotaExceededError, with: :rescue_from_carto_error

  def index
    opts = { valid_order_combinations: VALID_ORDER_PARAMS }
    page, per_page, order, order_direction = page_per_page_order_params(VALID_ORDER_PARAMS, opts)
    params[:type] = Carto::Visualization::TYPE_KUVIZ
    vqb = query_builder_with_filter_from_hash(params)

    visualizations = vqb.with_order(order, order_direction)
                        .build_paged(page, per_page).map do |v|
      Carto::Api::Public::KuvizPresenter.new(self, v.user, v).to_hash
    end
    response = {
      visualizations: visualizations,
      total_entries: vqb.count
    }
    render_jsonp(response)
  rescue Carto::ParamInvalidError, Carto::ParamCombinationInvalidError => e
    render_jsonp({ error: e.message }, e.status)
  rescue StandardError => e
    log_error(exception: e)
    render_jsonp({ error: e.message }, 500)
  end

  def create
    return update if @kuviz

    kuviz = create_visualization_metadata(@logged_user)
    asset = Carto::Asset.for_visualization(visualization: kuviz,
                                           resource: StringIO.new(Base64.decode64(params[:data])))
    asset.save
    Carto::Tracking::Events::CreatedMap.new(@logged_user.id, event_properties(kuviz).merge(origin: 'custom')).report

    render_jsonp(Carto::Api::Public::KuvizPresenter.new(self, @logged_user, kuviz).to_hash, 200)
  rescue ActiveRecord::RecordInvalid => e
    log_error(message: 'Error creating kuviz', params: params, exception: e)
    render_jsonp({ error: e.message }, 400)
  rescue StandardError => e
    log_error(message: 'Error creating kuviz', params: params, exception: e)
    render_jsonp({ error: 'The kuviz can not be created' }, 500)
  end

  def update
    @kuviz.update_attributes!(params.permit(:name, :privacy, :password))

    if params[:data].present?
      @kuviz.asset.update_visualization_resource(StringIO.new(Base64.decode64(params[:data])))
      # In case we only update the asset we need to invalidate the visualization
      @kuviz.save
    end
    Carto::Tracking::Events::ModifiedMap.new(@logged_user.id, event_properties(@kuviz)).report

    render_jsonp(Carto::Api::Public::KuvizPresenter.new(self, @logged_user, @kuviz).to_hash, 200)
  rescue ActiveRecord::RecordInvalid => e
    render_jsonp({ error: e.message }, 400)
  end

  def delete
    Carto::Tracking::Events::DeletedMap.new(@logged_user.id, event_properties(@kuviz)).report
    @kuviz.destroy
    head 204
  rescue StandardError => e
    log_error(message: 'Error deleting kuviz', exception: e, visualization: @kuviz)
    render_jsonp({ errors: [e.message] }, 400)
  end

  private

  def create_visualization_metadata(user)
    kuviz = Carto::Visualization.new
    kuviz.name = params[:name]
    kuviz.privacy = params[:password].present? ? Carto::Visualization::PRIVACY_PROTECTED : Carto::Visualization::PRIVACY_PUBLIC
    kuviz.password = params[:password]
    kuviz.type = Carto::Visualization::TYPE_KUVIZ
    kuviz.user = user
    kuviz.save!
    kuviz
  end

  def event_properties(kuviz)
    {
      user_id: @logged_user.id,
      visualization_id: kuviz.id
    }
  end

  def get_user
    @logged_user = current_viewer.present? ? Carto::User.find(current_viewer.id) : nil
  end

  def check_master_api_key
    api_key = Carto::ApiKey.find_by_token(params["api_key"])
    raise Carto::UnauthorizedError unless api_key&.master?
  end

  def check_edition_permission
    head(403) unless @kuviz.has_permission?(@logged_user, Carto::Permission::ACCESS_READWRITE)
  end

  def check_public_map_quota
    return unless CartoDB::QuotaChecker.new(@logged_user).will_be_over_public_map_quota?
    raise Carto::QuotaExceededError.new('Public map quota exceeded')
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

  def get_kuviz
    @kuviz = Carto::Visualization.find(params[:id])
    if @kuviz.nil?
      raise Carto::LoadError.new('Kuviz doesn\'t exist', 404)
    end
  end

  def validate_if_exists
    @if_exists = params[:if_exists]
    if @if_exists.nil?
      @if_exists = @kuviz.present? ? IF_EXISTS_REPLACE : IF_EXISTS_FAIL
    end

    raise Carto::ParamInvalidError.new(:if_exists, VALID_IF_EXISTS.join(', ')) unless VALID_IF_EXISTS.include?(@if_exists)
  end

  def get_last_one
    if @if_exists == IF_EXISTS_REPLACE
      @kuviz = kuvizs_by_name.order(updated_at: :desc).first
    end
  end

  def remove_duplicates
    if @if_exists == IF_EXISTS_REPLACE
      existing_kuvizs = kuvizs_by_name - [@kuviz]
      existing_kuvizs.each(&:destroy!)
    end
  end

  def kuvizs_by_name
    Carto::Visualization.where(user: @logged_user, name: params[:name], type: Carto::Visualization::TYPE_KUVIZ)
  end
end

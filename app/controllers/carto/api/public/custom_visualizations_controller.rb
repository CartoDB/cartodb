require_relative '../visualization_searcher'
require_relative '../paged_searcher'

class Carto::Api::Public::CustomVisualizationsController < Carto::Api::Public::ApplicationController
  include Carto::Api::VisualizationSearcher
  include Carto::Api::PagedSearcher

  CONTENT_LENGTH_LIMIT_IN_BYTES = 20000
  VALID_ORDER_PARAMS = %i(name updated_at privacy).freeze

  ssl_required

  before_action :validate_input_data, only: [:create, :update]

  def index
    opts = { valid_order_combinations: VALID_ORDER_PARAMS }
    page, per_page, order, order_direction = page_per_page_order_params(VALID_ORDER_PARAMS, opts)
    params[:type] = Carto::Visualization::TYPE_KUVIZ
    vqb = query_builder_with_filter_from_hash(params)

    visualizations = vqb.with_order(order, order_direction)
                        .build_paged(page, per_page).map do |v|
      asset = Carto::Asset.find_by_visualization_id(v.id)
      Carto::Api::Public::KuvizPresenter.new(self, v.user, v, asset).to_hash
    end
    response = {
      visualizations: visualizations,
      total_entries: vqb.build.size
    }
    render_jsonp(response)
  rescue Carto::ParamInvalidError, Carto::ParamCombinationInvalidError => e
    render_jsonp({ error: e.message }, e.status)
  rescue StandardError => e
    CartoDB::Logger.error(exception: e)
    render_jsonp({ error: e.message }, 500)
  end

  def create
    user = current_viewer.present? ? Carto::User.find(current_viewer.id) : nil
    kuviz = create_visualization_metadata(user)
    asset = Carto::Asset.for_visualization(visualization: kuviz,
                                           resource: StringIO.new(Base64.decode64(params[:data])))
    asset.save

    render_jsonp(Carto::Api::Public::KuvizPresenter.new(self, user, kuviz, asset).to_hash, 200)
  rescue StandardError => e
    CartoDB::Logger.error(exception: e)
    render_jsonp({ error: 'cant create the kuviz' }, 500)
  end

  def update
    head 501
  end

  def delete
    head 501
  end

  private

  def create_visualization_metadata(user)
    kuviz = Carto::Visualization.new
    kuviz.name = params[:name]
    kuviz.privacy = params[:password].present? ? Carto::Visualization::PRIVACY_PROTECTED : Carto::Visualization::PRIVACY_PUBLIC
    kuviz.password = params[:password]
    kuviz.type = Carto::Visualization::TYPE_KUVIZ
    kuviz.user = user
    kuviz.save
    kuviz
  end

  def validate_input_data
    if request.content_length > CONTENT_LENGTH_LIMIT_IN_BYTES
      return render_jsonp({ error: "visualization over the size limit (#{CONTENT_LENGTH_LIMIT_IN_BYTES})" }, 400)
    elsif !params[:data].present?
      return render_jsonp({ error: 'missing data parameter' }, 400)
    elsif !params[:name].present?
      return render_jsonp({ error: 'missing name parameter' }, 400)
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

  def html_param?(data)
    # FIXME this is a very naive implementantion. I'm trying to use
    # Nokogiri to validate the HTML but it doesn't works as I want
    # so
    data.match(/\<html.*\>/).present?
  end

end

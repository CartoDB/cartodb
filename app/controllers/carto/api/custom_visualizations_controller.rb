class Carto::Api::CustomVisualizationsController < ::Api::ApplicationController
  CONTENT_LENGTH_LIMIT_IN_BYTES = 20000

  ssl_required :index, :create, :update, :delete

  before_action :validate_input_data, only: [:create, :update]
  before_action :api_authorization_required

  def index
    head 501
  end

  def create
    user = current_viewer.present? ? Carto::User.find(current_viewer.id) : nil
    kuviz = create_visualization_metadata(user)
    asset = Carto::Asset.for_visualization(visualization: kuviz,
                                           resource: StringIO.new(Base64.decode64(params[:data])))
    asset.save

    render_jsonp(Carto::Api::AssetPresenter.new(asset).to_hash,200)
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
    kuviz.type = Carto::Visualization::TYPE_KUVIZ
    kuviz.user = user
    kuviz.save
    kuviz
  end

  def validate_input_data
    if request.content_length > CONTENT_LENGTH_LIMIT_IN_BYTES
      return render_jsonp({error: 'visualization over the size limit'}, 400)
    elsif params[:data].present?
      return render_jsonp({error: 'not a valid visualization parameter'}, 400) unless html_param?
    end

    return render_jsonp({error: 'missing data parameter'}, 400) unless params[:data].present?
    return render_jsonp({error: 'missing name parameter'}, 400) unless params[:name].present?
  end

  def html_param?
    # FIXME this is a very naive implementantion. I'm trying to use
    # Nokogiri to validate the HTML but it doesn't works as I want
    # so
    Base64.decode64(params[:data]).match(/\<html.*\>/).present?
  end

end

class Carto::Api::Public::CustomVisualizationsController < Carto::Api::Public::ApplicationController
  CONTENT_LENGTH_LIMIT_IN_BYTES = 20000

  ssl_required

  before_action :validate_input_data, only: [:create, :update]

  def index
    head 501
  end

  def create
    user = current_viewer.present? ? Carto::User.find(current_viewer.id) : nil
    kuviz = create_visualization_metadata(user)
    asset = Carto::Asset.for_visualization(visualization: kuviz,
                                           resource: StringIO.new(Base64.decode64(params[:data])))
    asset.save

    render_jsonp(Carto::Api::Public::KuvizPresenter.new(user,kuviz,asset).to_hash,200)
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
      return render_jsonp({error: 'visualization over the size limit'}, 400)
    elsif !params[:data].present?
      return render_jsonp({error: 'missing data parameter'}, 400)
    elsif !params[:name].present?
      return render_jsonp({error: 'missing name parameter'}, 400)
    end

    if params[:data].present?
      return render_jsonp({error: 'data parameter must be encoded in base64'}, 400) unless base64?(params[:data])
      return render_jsonp({error: 'data parameter must be HTML'}, 400) unless html_param?(params[:data])
    end
  end

  def base64?(data)
    begin
      Base64.strict_decode64(data)
      true
    rescue ArgumentError
      false
    end
  end

  def html_param?(data)
    # FIXME this is a very naive implementantion. I'm trying to use
    # Nokogiri to validate the HTML but it doesn't works as I want
    # so
    Base64.strict_decode64(data).match(/\<html.*\>/).present?
  end

end

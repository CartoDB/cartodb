class DataLibraryController < ApplicationController

  layout 'data_library'

  ssl_allowed :index, :search
  before_filter :get_viewed_user

  def index
    if @viewed_user.nil? || (Cartodb.get_config(:data_library, 'username') && (Cartodb.get_config(:data_library, 'username') != @viewed_user.username))
      render_404 and return
    end

    @dataset_base_url = if Cartodb.get_config(:ssl_required) == true
                          "#{request.protocol}#{CartoDB.account_host}/dataset/"
                        else
                          "#{@viewed_user.public_url(nil, request.protocol == 'https://' ? 'https' : 'http')}/tables/"
                        end

    respond_to do |format|
      format.html { render 'index' }
    end
  end

  private

  def get_viewed_user
    username = CartoDB.extract_subdomain(request).strip.downcase
    @viewed_user = User.where(username: username).first
  end

end

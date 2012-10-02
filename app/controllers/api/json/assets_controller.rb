#encoding: UTF-8
class Api::Json::AssetsController < Api::ApplicationController
  ssl_required :index, :create, :destroy

  def index
    @assets = current_user.assets
    render_jsonp({ :total_entries => @assets.size,
                   :assets => @assets.map(&:public_values)
                })
  end

  def create
    @asset = Asset.new
    @asset.user_id = current_user.id
    @asset.asset_file = params[:file]

    if @asset.save
      render_jsonp(@asset.public_values)
    else
      CartoDB::Logger.info "Error on assets#create", @layer.errors.full_messages
      render_jsonp( { :description => @layer.errors.full_messages,
                      :stack => @layer.errors.full_messages
                    }, 400)
    end
  end

  def destroy
    Asset[params[:id]].destroy
    head :ok
  end
end

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
    @asset.raise_on_save_failure = true
    @asset.user_id = current_user.id
    @asset.asset_file = params[:filename]
    @asset.url = params[:url]
    @asset.kind = params[:kind]

    @asset.save
    render_jsonp(@asset.public_values)
  rescue Sequel::ValidationFailed => e
    render json: { error: @asset.errors.full_messages }, status: 400
  rescue => e
    render json: { error: [e.message] }, status: 400
  end

  def destroy
    Asset[params[:id]].destroy
    head :ok
  end
end

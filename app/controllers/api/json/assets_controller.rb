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
    @stats_aggregator.timing('assets.create') do

      begin
        @asset = Asset.new
        @asset.raise_on_save_failure = true
        @asset.user_id = current_user.id
        @asset.asset_file = params[:filename]
        @asset.url = params[:url]
        @asset.kind = params[:kind]

        @stats_aggregator.timing('save') do
          @asset.save
        end

        render_jsonp(@asset.public_values)
      rescue Sequel::ValidationFailed => e
        render json: { error: @asset.errors.full_messages }, status: 400
      rescue => e
        render json: { error: [e.message] }, status: 400
      end

    end
  end

  def destroy
    @stats_aggregator.timing('assets.destroy.delete') do
      
      begin
        Asset[params[:id]].destroy
        head :ok
      rescue => e
        render json: { error: [e.message] }, status: 400
      end

    end
  end

end

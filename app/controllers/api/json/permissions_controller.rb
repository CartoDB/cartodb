class Api::Json::PermissionsController < Api::ApplicationController

  ssl_required :update if Rails.env.production? || Rails.env.staging?

  def update
    @stats_aggregator.timing('overlays.update') do

      permission = CartoDB::Permission.where(id: params[:id]).first

      return head(404) if permission.nil?
      return head(401) unless permission.is_owner?(current_user)

      begin
        acl = params[:acl]
        acl ||= []
        permission.acl = acl.map { |entry| entry.deep_symbolize_keys }
      rescue CartoDB::PermissionError => e
        CartoDB.notify_exception(e)
        return head(400)
      end

      @stats_aggregator.timing('save') do
        permission.save
      end

      render json: permission.to_poro

    end
  end

end

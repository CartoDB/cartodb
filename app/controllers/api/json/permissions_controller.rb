class Api::Json::PermissionsController < Api::ApplicationController

  ssl_required :update if Rails.env.production? || Rails.env.staging?

  def update
    permission = CartoDB::Permission.where(id: params[:id]).first

    return head(404) if permission.nil?
    return head(401) unless permission.is_owner?(current_user)

    begin
      permission.acl = params[:acl].map { |entry| entry.deep_symbolize_keys }
    rescue CartoDB::PermissionError => e
      CartoDB.notify_exception(e)
      return head(400)
    end

    permission.save

    render json: permission.to_poro
  end

end

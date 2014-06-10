class Api::Json::PermissionsController < Api::ApplicationController

  if Rails.env.production? || Rails.env.staging?
    ssl_required :show
  end

  def update
    permission = CartoDB::Permission.where(id: params[:id]).first

    return head(404) if permission.nil?
    return head(401) unless permission.is_owner(current_user)

    begin
      permission.acl = params[:acl].map { |entry| entry.deep_symbolize_keys }
    rescue PermissionError => e
      # LOG internally the error
      return head(400)
    end

    permission.save

    render json: permission.to_poro
  end

  def show
    permission = CartoDB::Permission.where(id: params[:id]).first

    return head(404) if permission.nil?
    return head(401) unless permission.is_owner(current_user)

    render json: permission.to_poro
  end

end

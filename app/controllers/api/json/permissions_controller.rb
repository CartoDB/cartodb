class Api::Json::PermissionsController < Api::ApplicationController

  if Rails.env.production? || Rails.env.staging?
    ssl_required :show
  end

  def update
    permission = CartoDB::Permission.where(id:params[:id]).first

    return head(404) if permission.nil?
    return head(401) unless permission.is_owner(current_user)

    # TODO: update perm

    render json: permission
  end

  def show
    permission = CartoDB::Permission.where(id:params[:id]).first

    return head(404) if permission.nil?
    return head(401) unless permission.is_owner(current_user)

    render json: permission.to_poro
  end

end

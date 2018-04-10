module FullstoryHelper
  def insert_fullstory
    if fullstory_enabled?(current_user)
      render(partial: 'shared/fullstory', locals: { org: Cartodb.get_config(:fullstory, 'org') })
    end
  end

  def fullstory_enabled?(user)
    Cartodb.get_config(:fullstory, 'org').present? && user.try(:fullstory_enabled?) && params[:cookies] != '0'
  end
end

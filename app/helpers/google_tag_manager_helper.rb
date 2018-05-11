module GoogleTagManagerHelper
  def insert_google_tag_manager(container_name = 'primary')
    container_id = get_container_id(container_name)
    if container_id.present? && params[:cookies] != '0'
      render(partial: 'shared/google_tag_manager', locals: { container_id: container_id })
    end
  end

  def insert_google_tag_manager_no_script(container_name = 'primary')
    container_id = get_container_id(container_name)
    if container_id.present? && params[:cookies] != '0'
      render(partial: 'shared/google_tag_manager_no_script', locals: { container_id: container_id })
    end
  end

  private

  def get_container_id(container_name)
    Cartodb.config[:google_tag_manager] &&
      Cartodb.config[:google_tag_manager][container_name]
  end
end

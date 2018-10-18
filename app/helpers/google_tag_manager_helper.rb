module GoogleTagManagerHelper
  def insert_google_tag_manager(container_name)
    render_google_tag_manager_tag('shared/google_tag_manager', container_name)
  end

  def insert_google_tag_manager_no_script(container_name)
    render_google_tag_manager_tag('shared/google_tag_manager_no_script', container_name)
  end

  private

  def render_google_tag_manager_tag(partial, container_name)
    container_id = get_container_id(container_name)
    if container_id.present? && params[:cookies] != '0'
      render(partial: partial, locals: { container_id: container_id })
    end
  end

  def get_container_id(container_name)
    Cartodb.get_config(:google_tag_manager, container_name)
  end
end

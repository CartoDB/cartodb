module ApplicationHelper

  def table_privacy(table)
    return 'PRIVATE' if table.private?
    return 'PUBLIC'  if table.public?
  end

  def css_class_for_privacy(table)
    table_privacy(table).downcase
  end

  def show_footer?
    controller_name == 'tables' && action_name != 'show'
  end

  def in_my_tables?
    controller_name == 'tables' && action_name == 'index' && !params[:public]
  end

  def current_path
    request.path
  end

  def selected_if(condition)
    condition ? 'selected' : ''
  end

end

class UserMailer < ActionMailer::Base
  default from: "cartodb.com <support@cartodb.com>"
  layout 'mail'

  def new_organization_user(user)
    @user = user
    @organization = @user.organization
    @owner = @organization.owner
    @link = "#{CartoDB.base_url(@organization.name)}#{dashboard_path(user_domain: @user.username)}" 
    mail :to => @user.email, 
         :subject => "You have been invited to CartoDB organization '#{@organization.name}'"
  end

  def share_table(table, user)
    @table_visualization = table
    @user = user
    organization = @table_visualization.user.organization
    @link = "#{CartoDB.base_url(organization.name)}#{public_tables_show_bis_path(user_domain: @user.username, id: "#{@table_visualization.user.username}.#{@table_visualization.name}")}"
    mail :to => @user.email, 
         :subject => "#{@table_visualization.user.username} has shared a CartoDB table with you"
  end
  
  def share_visualization(visualization, user)
    @visualization = visualization
    @user = user
    organization = @visualization.user.organization
    @link = "#{CartoDB.base_url(organization.name)}#{public_visualizations_show_map_path(user_domain: @visualization.user.username, id: @visualization.id)}"
    mail :to => @user.email,
         :subject => "#{@visualization.user.username} has shared a CartoDB visualization with you"
  end

  def unshare_table(table_visualization_name, table_visualization_owner_name, user)
    @table_visualization_name = table_visualization_name
    @table_visualization_owner_name = table_visualization_owner_name
    @user = user
    mail :to => @user.email,
         :subject => "#{@table_visualization_owner_name} has stopped sharing a CartoDB table with you"
  end
  
  def unshare_visualization(visualization_name, visualization_owner_name, user)
    @visualization_name = visualization_name
    @visualization_owner_name = visualization_owner_name
    @user = user
    mail :to => @user.email,
         :subject => "#{@visualization_owner_name} has stopped sharing a CartoDB visualization with you"
  end

  def data_import_finished(user, imported_tables, total_tables)
    @imported_tables = imported_tables
    @total_tables = total_tables
    @link = "#{user.public_url}#{tables_index_path}"
    mail :to => user.email,
         :subject => "Table import finished"
  end
  
end

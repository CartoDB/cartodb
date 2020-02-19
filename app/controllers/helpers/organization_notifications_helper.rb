module OrganizationNotificationsHelper
  def load_organization_notifications
    carto_user = Carto::User.where(id: current_user.id).first if current_user

    @organization_notifications = carto_user ? carto_user.received_notifications.unread.map { |n| Carto::Api::ReceivedNotificationPresenter.new(n) } : {}
  end
end

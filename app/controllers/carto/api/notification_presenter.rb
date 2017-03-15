# encoding utf-8

class Carto::Api::NotificationPresenter
  def initialize(notification)
    @notification = notification
  end

  def to_hash
    {
      id: @notification.id,
      organization_id: @notification.organization_id,
      icon: @notification.icon,
      recipients: @notification.recipients,
      body: @notification.body,
      created_at: @notification.created_at
    }
  end
end

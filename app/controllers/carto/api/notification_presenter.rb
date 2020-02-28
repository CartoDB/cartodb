class Carto::Api::NotificationPresenter
  extend Forwardable
  include Carto::HtmlSafe

  delegate [:id, :icon, :recipients, :body, :created_at] => :@notification

  def initialize(notification)
    @notification = notification
  end

  def html_body
    markdown_html_safe(@notification.body)
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

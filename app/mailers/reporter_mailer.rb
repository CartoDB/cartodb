class ReporterMailer < ActionMailer::Base
  default from: Cartodb.get_config(:mailer, 'from')
  layout 'mail'

  def trending_maps_report(mail_to, trending_visualizations)
    @subject = "Daily trending maps report"
    @trending_visualizations = trending_visualizations

    mail to: mail_to, subject: @subject
  end

  def named_maps_near_the_limit(message)
    mail_to = Cartodb.get_config(:mailer, 'support_email')
    mail_from = Cartodb.get_config(:mailer, 'internal_notifications_email')

    mail from: mail_from, to: mail_to, subject: message if mail_to && mail_from
  end
end

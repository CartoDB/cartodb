class DataObservatoryMailer < ActionMailer::Base

  CARTO_REQUEST_RECIPIENT = 'dataobservatory@carto.com'.freeze

  default from: Cartodb.get_config(:mailer, 'from')
  layout 'mail'

  def user_request(user, dataset_id)
    subject = 'Your Data Observatory request'
    @user_name = user.name
    @dataset_id = dataset_id

    mail to: user.email, subject: subject
  end

  def carto_request(user, dataset_id, delivery_days)
    subject = 'Data Observatory request'
    @user_name = user.name
    @user_email = user.email
    @dataset_id = dataset_id
    @delivery_days = delivery_days

    mail to: CARTO_REQUEST_RECIPIENT, subject: subject
  end
end

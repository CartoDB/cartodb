class SyncMailer < ActionMailer::Base
  default from: Cartodb.get_config(:mailer, 'from')
  layout 'mail'

  def max_retries_reached(user, visualization_id, dataset_name, error_code, error_message)
    @error_code = error_code
    @error_message = error_message
    @dataset_name = dataset_name
    @link = "#{user.public_url}#{CartoDB.path(self, 'public_tables_show', { id: visualization_id })}"
    @subject = "There was a problem while syncing your dataset"

    mail :to => user.email,
         :subject => @subject
  end

end

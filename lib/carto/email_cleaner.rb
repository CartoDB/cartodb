module Carto::EmailCleaner
  def clean_email(email)
    email.strip.downcase
  end
end

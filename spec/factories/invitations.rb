FactoryBot.define do
  # This can't work because activerecord-postgresql-array bug (see Carto::Invitation).
  # Use Carto::Invitation.create_new instead
  # factory :invitation, class: Carto::Invitation do
  #   users_emails ['first_email@whatever.com', 'second_email@whatever.com' ]
  #   welcome_text 'Welcome to the jungle'
  # end
end

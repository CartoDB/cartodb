namespace :cartodb do
  namespace :db do
    desc "Add an IDP (Indentity service provider) to the cartodb system"
    task :add_saml_idp => :environment do
      raise "Please provide the idp name" if ENV['IDP_NAME'].blank?
      raise "Please provide the idp cert" if ENV['IDP_CERT'].blank?

      # when running this task along with db:migrate
      # relaod the schema
      SamlIdentityProvider.set_dataset :saml_identity_providers
      
      idp = SamlIdentityProvider.new
      idp.idp_name = ENV['IDP_NAME']
      idp.idp_cert = ENV['IDP_CERT']
      idp.save

      raise idp.errors.inspect if idp.new?
      puts "IDP #{idp.idp_name} created successfully"
    end
  end
end

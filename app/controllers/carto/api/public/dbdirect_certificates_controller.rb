module Carto
  module Api
    module Public
      class DbdirectCertificatesController < Carto::Api::Public::ApplicationController
        include Carto::ControllerHelper
        extend Carto::DefaultRescueFroms

        before_action :load_user
        before_action :check_permissions

        setup_default_rescues

        def list
          dbdirect_certificates = @user.dbdirect_certificates
          certificates_info = dbdirect_certificates.map do |certificate|
            Carto::Api::DbdirectCertificatePresenter.new(certificate).to_poro
          end
          render_jsonp(certificates_info, 200)
        end

        def show
          dbdirect_certificate = Carto::DbdirectCertificate.find(params[:id])
          check_permissions_for_certificate(dbdirect_certificate)
          render_jsonp(Carto::Api::DbdirectCertificatePresenter.new(dbdirect_certificate).to_poro, 200)
        end

        def create
          validity_days = params[:validity].blank? ? Carto::DbdirectCertificate.default_validity : params[:validity].to_i
          data, cert = Carto::DbdirectCertificate.generate(
            user: @user,
            name: params[:name],
            passphrase: params[:pass],
            ips: params[:ips],
            validity_days: validity_days,
            server_ca: params[:server_ca]
          )
          result = {
            id: cert.id,
            name: cert.name, # must include name since we may have changed or generated it
            client_key: data[:client_key],
            client_crt: data[:client_crt],
            server_ca: data[:server_ca]
          }
          # render json: result, 201
          render_jsonp(result, 201)
        end

        def destroy
          dbdirect_certificate = Carto::DbdirectCertificate.find(params[:id])
          check_permissions_for_certificate(dbdirect_certificate)
          dbdirect_certificate.destroy!
          render_jsonp(Carto::Api::DbdirectCertificatePresenter.new(dbdirect_certificate).to_poro, 200)
        end

        private

        def load_user
          @user = Carto::User.find(current_viewer.id)
        end

        def check_permissions
          api_key = Carto::ApiKey.find_by_token(params["api_key"])
          raise UnauthorizedError unless api_key&.master?
          raise UnauthorizedError unless api_key.user_id === @user.id
          unless @user.has_feature_flag?('dbdirect')
            raise UnauthorizedError.new("DBDirect not enabled for user #{@user.username}")
          end
        end

        def check_permissions_for_certificate(dbdirect_certificate)
          raise UnauthorizedError unless dbdirect_certificate.user_id == @user.id
        end
      end
    end
  end
end

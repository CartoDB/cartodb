require 'zip'

module Carto
  module Api
    class DbdirectCertificatesController < ::Api::ApplicationController
      include Carto::ControllerHelper
      extend Carto::DefaultRescueFroms

      ssl_required :list, :show, :create, :destroy

      before_action :load_user
      before_action :check_permissions

      setup_default_rescues

      def index
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

        respond_to do |format|
          format.json do
            render_jsonp(result, 201)
          end
          format.zip do
            send_data(*zip_certificates(result, 201))
          end
        end
      end

      def destroy
        dbdirect_certificate = Carto::DbdirectCertificate.find(params[:id])
        check_permissions_for_certificate(dbdirect_certificate)
        dbdirect_certificate.destroy!
        head :no_content
      end

      private

      def zip_certificates(result, status)
        # TODO: this shouldn't live here, should it?
        username = @user.username
        dbproxy_host = Cartodb.get_config(:dbdirect, 'pgproxy', 'host')
        dbproxy_port = Cartodb.get_config(:dbdirect, 'pgproxy', 'port')
        certificate_id = result[:id]
        certificate_name = result[:name]
        client_key = result[:client_key]
        client_crt = result[:client_crt]
        server_ca = result[:server_ca]

        readme_params = {
          certificate_id: certificate_id,
          certificate_name: certificate_name,
          username: username,
          dbproxy_host: dbproxy_host,
          dbproxy_port: dbproxy_port
        }
        if params[:readme].present?
          readme = view_context.render(inline: params[:readme], :locals => readme_params)
        else
          readme = view_context.render(template: 'carto/api/dbdirect_certificates/README.txt.erb', :locals => readme_params)
        end

        filename = "#{certificate_name}.zip"

        zip_data = readme
        zipstream = Zip::OutputStream.write_buffer do |zio|
          zio.put_next_entry('README.txt')
          zio.write readme

          zio.put_next_entry('client.key')
          zio.write client_key

          zio.put_next_entry('client.crt')
          zio.write client_crt

          if server_ca.present?
            zio.put_next_entry('server_pa.pem')
            zio.write server_ca
          end
        end
        zip_data = zipstream.string

        [
          zip_data,
          type: "application/zip; charset=binary; header=present",
          disposition: "attachment; filename=#{filename}",
          status: status
        ]
      end

      def load_user
        @user = Carto::User.find(current_viewer.id)
      end

      def check_permissions
        # TODO: should the user be an organization owner?
        api_key = Carto::ApiKey.find_by_token(params["api_key"])
        if api_key.present?
          raise UnauthorizedError unless api_key.master?
          raise UnauthorizedError unless api_key.user_id == @user.id
        end
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

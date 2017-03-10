# encoding: UTF-8

require_dependency 'carto/controller_helper'

module Carto
  class SamlController < ApplicationController
    include Carto::ControllerHelper

    ssl_required  :metadata
    before_filter :load_organization, :ensure_saml_enabled

    rescue_from LoadError, UnauthorizedError, with: :rescue_from_carto_error

    def metadata
      render(xml: Carto::SamlService.new(@organization).saml_metadata)
    end

    private

    def load_organization
      @organization = Carto::Organization.where(name: CartoDB.extract_subdomain(request)).first
      raise LoadError.new('Organization does not exist') unless @organization
    end

    def ensure_saml_enabled
      raise UnauthorizedError.new('SAML not enabled') unless @organization.auth_saml_enabled?
    end
  end
end

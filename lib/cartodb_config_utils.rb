module CartoDB
  module ConfigUtils
    # if cartodb_com_hosted is false, means that it is SaaS. If it's true (or doesn't exist), it's a custom installation
    def cartodb_com_hosted?
      Cartodb.config[:cartodb_com_hosted].nil? || Cartodb.config[:cartodb_com_hosted]
    end

    def cartodb_onpremise_version
      Cartodb.config[:onpremise_version]
    end
  end
end

module CartoDB
  module ConfigUtils

    def cartodb_com_hosted?
      Cartodb.config[:cartodb_com_hosted].nil? || Cartodb.config[:cartodb_com_hosted]
    end

  end
end

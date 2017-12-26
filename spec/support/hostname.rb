module Cartodb

  def self.hostname
    "http://#{Cartodb.config[:session_domain].gsub(/^\./,'')}:53716"
  end

end

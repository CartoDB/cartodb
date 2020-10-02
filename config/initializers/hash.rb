class Hash

  def convert_nulls
    each_with_object({}) { |(k, v), h| h[k] = (v == 'null' ? nil : v); }
  end

end

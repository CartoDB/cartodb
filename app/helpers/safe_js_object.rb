module SafeJsObject
  # Wraps a JSON object to be loaded as a JS object in a safe way.
  #
  # @example expected usage (my-template.erb), illustrated with a Visualization object
  #   <script>
  #     var vizdata = <%= safe_js_object vis.to_vizjson.to_json %>;
  #   </script>
  #
  # @return string
  def safe_js_object(obj)
    # see http://api.rubyonrails.org/v3.2.21/classes/ERB/Util.html#method-c-j
    raw "JSON.parse('#{ j(obj.html_safe) }')"
  end
end

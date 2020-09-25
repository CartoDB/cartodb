require 'ruby-prof'
require 'stringio'

module CartoDB

  # A profiler based on https://github.com/justinweiss/request_profiler/
  class Profiler

    def initialize(exclude: nil)
      @exclusions = exclude
    end

    def call(request, response)
      mode = profile_mode(request)

      ::RubyProf.measure_mode = mode
      ::RubyProf.start
      begin
        yield
      ensure
        result = ::RubyProf.stop
        write_result(result, request, response)
      end
    end

    def profile_mode(request)
      mode_string = request.params["profile_request"]
      if mode_string
        if mode_string.downcase == "true" or mode_string == "1"
          ::RubyProf::PROCESS_TIME
        else
          ::RubyProf.const_get(mode_string.upcase)
        end
      end
    end

    def write_result(result, request, response)
      result.eliminate_methods!(@exclusions) if @exclusions
      printer = ::RubyProf::CallTreePrinter.new(result)
      url = request.fullpath.gsub(/[?\/]/, '-')
      base_name = "callgrind.#{Time.now.strftime('%Y-%m-%d-%H-%M-%S')}-#{url.slice(0, 50)}"
      printer.print(path: Dir.tmpdir, profile: base_name)

      # see https://github.com/ruby-prof/ruby-prof/blob/1.4.1/lib/ruby-prof/printers/call_tree_printer.rb#L115
      output_file_name = [base_name, "callgrind.out", $$].join(".")
      output_file_path = File.join(Dir.tmpdir, output_file_name)

      response.body = File.read(output_file_path)
      response.status = 200
      response.content_type = 'text/plain'
      response.headers['Content-Disposition'] = "attachment; filename=\"#{output_file_name}\""
    ensure
      File.delete(output_file_path) if File.exist?(output_file_path)
    end

  end
end

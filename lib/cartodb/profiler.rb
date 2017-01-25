require 'ruby-prof'

require 'carto/configuration'

module CartoDB

  # A profiler based on https://github.com/justinweiss/request_profiler/
  class Profiler
    include Carto::Configuration

    def initialize(options = {})
      @printer = options[:printer] || ::RubyProf::CallTreePrinter
      @exclusions = options[:exclude]

      @path = options[:path]
      @path ||= log_dir_path + 'tmp/performance' if defined?(Rails)
      @path ||= ::File.join((ENV["TMPDIR"] || "/tmp"), 'performance')
      @path = Pathname(@path)
    end

    def call(request)
      mode = profile_mode(request)

      ::RubyProf.measure_mode = mode
      ::RubyProf.start
      begin
        yield
      ensure
        result = ::RubyProf.stop
        write_result(result, request)
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

    def format(printer)
      case printer
      when ::RubyProf::FlatPrinter
        'txt'
      when ::RubyProf::FlatPrinterWithLineNumbers
        'txt'
      when ::RubyProf::GraphPrinter
        'txt'
      when ::RubyProf::GraphHtmlPrinter
        'html'
      when ::RubyProf::DotPrinter
        'dot'
      when ::RubyProf::CallTreePrinter
        "out.#{Process.pid}"
      when ::RubyProf::CallStackPrinter
        'html'
      else
        'txt'
      end
    end

    def prefix(printer)
      case printer
      when ::RubyProf::CallTreePrinter
        "callgrind."
      else
        ""
      end
    end

    def write_result(result, request)
      result.eliminate_methods!(@exclusions) if @exclusions
      printer = @printer.new(result)
      Dir.mkdir(@path) unless ::File.exists?(@path)
      url = request.fullpath.gsub(/[?\/]/, '-')
      filename = "#{prefix(printer)}#{Time.now.strftime('%Y-%m-%d-%H-%M-%S')}-#{url.slice(0, 50)}.#{format(printer)}"
      ::File.open(@path + filename, 'w+') do |f|
        printer.print(f)
      end
    end

  end
end

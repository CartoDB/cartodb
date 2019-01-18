// Restores any previous global libraries, e.g. jQuery
for (var lib in window._prev){
	window[lib] = window._prev[lib];
}

cartodb.moduleLoad('torque', torque);

Profiler = cartodb.core.Profiler;
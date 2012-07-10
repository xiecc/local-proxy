var util = require('util');
var exp = module.exports;

exp.createProxy = function(opts) {
	if(!opts || !opts.origin) {
		console.log('opts and opts.origin should not be empty.');
		return null;
	}
	
	return genObjectProxy(opts.namespace, opts.origin, opts);
};

var genObjectProxy = function(namespace, origin, opts) {
	//define proxy class
	var Proxy = function(){};
	util.inherits(Proxy, origin.constructor);
	
	//generate proxy for primary field
	for(var field in origin) {
		if(typeof origin[field] !== 'function') {
			genPrimaryProxy(origin, Proxy, field);
		}
	}
	
	//generate proxy for function field
	var res = new Proxy();
	for(var field in origin) {
		if(typeof origin[field] === 'function') {
			res[field] = genFunctionProxy(namespace, origin, field, opts);
		}
	}
	
	return res;
};

/**
 * generate prxoy for function type field
 * 
 * @param namespace cur namespace
 * @param origin origin object
 * @param funName target function name
 * @param opts proxy opts
 * @returns function proxy
 */
var genFunctionProxy = function(namespace, origin, funName, opts) {
	if(!opts.callback || (!!opts.filter && !opts.filter(namespace, funName))) {
		//if no callback or filter return false means use the original function
		return function() {
			origin[funName].apply(origin, arguments);
		};
	}
	
	return (function() {
		var callback = opts.callback;
		
		function invoke() {
			origin[funName].apply(origin, arguments);
		}
		
		return function() {
			var args = Array.prototype.slice.call(arguments, 0);
			callback.call(null, namespace, funName, args, opts.attach, invoke);
		};
	})();
};

/**
 * generate proxy for primary type field
 * 
 * @param origin origin object
 * @param proxy proxy object
 * @param fieldName primary type field name
 */
var genPrimaryProxy = function(origin, proxyClass, fieldName) {
	proxyClass.prototype.__defineGetter__(fieldName, function() {
		return origin[fieldName];
	});
	
	proxyClass.prototype.__defineSetter__(fieldName, function(value) {
		origin[fieldName] = value;
	});
};
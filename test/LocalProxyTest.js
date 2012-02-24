var should = require('should');
var LocalProxy = require('../lib/LocalProxy');

var A = function(value) {
	this.value = value;
};
A.prototype.add = function(num) {
	this.value += num;
};
A.prototype.sub = function(num) {
	this.value -= num;
};
A.prototype.addB = function() {
	this.b.value++;
};
A.prototype.addInternal = function() {
	this.add(1);
};

var B = function(value){
	this.value = value;
};
B.prototype.addA = function() {
	this.a.value++;
};

var callback = function(namespace, method, args, invoke) {
	
};

var filter = function(namespace, method) {
	
};

describe('local proxy', function() {
	describe('#createProxy', function() {
		it('should invoke the proxy function if it had been set', function() {
			var callbackCount = 0;
			var cb = function(namespace, method, args, invoke) {
				callbackCount++;
			};
			var a = new A(1);
			
			var proxy = LocalProxy.createProxy({
				origin: a, 
				callback: cb
			});
			proxy.add(1);
			callbackCount.should.equal(1);
		});
		
		it('should invoke the origin function if the proxy function not set', function() {
			var value = 1;
			var a = new A(value);
			
			var proxy = LocalProxy.createProxy({
				origin: a
			});
			proxy.add(1);
			a.value.should.equal(value + 1);
		});
		
		it('should keep the same namespace and function name and args in filter and proxy function', function() {
			var callbackCount = 0;
			var filterCount = 0;
			var expectNamespace = "xxx.yyy.zzz";
			var expectMethod = "add";
			var a = new A(1);
			
			var cb = function(namespace, method, args, invoke) {
				callbackCount++;
				namespace.should.equal(expectNamespace);
				method.should.equal(expectMethod);
			};
			var filter = function(namespace, method) {
				filterCount++;
				namespace.should.equal(expectNamespace);
				(typeof a[method]).should.equal('function');
				return true;
			};
			
			var proxy = LocalProxy.createProxy({
				origin: a, 
				namespace: expectNamespace, 
				filter: filter, 
				callback: cb
			});
			proxy.add(1);
			filterCount.should.be.above(0);
			callbackCount.should.equal(1);
		});
		
		it('should filter the proxy function by filter function', function() {
			var callbackCount = 0;
			var filteredMethod = "add";
			
			var cb = function(namespace, method, args, invoke) {
				callbackCount++;
			};
			var filter = function(namespace, method) {
				if(method === filteredMethod)
					return false;
				return true;
			};
			
			var a = new A(1);
			
			var proxy = LocalProxy.createProxy({
				origin: a, 
				filter: filter, 
				callback: cb
			});
			
			proxy.add(1);
			proxy.sub(1);
			callbackCount.should.equal(1);
		});
		
		it('should invoke the origin function if the invoke callback had been called in proxy function', function() {
			var callbackCount = 0;
			var originCallCount = 0;
			var value = 1;
			
			var cb = function(namespace, method, args, invoke) {
				callbackCount++;
				invoke(args);
			};
			var a = new A(value);
			a.add = function(num) {
				originCallCount++;
				this.value += this.value;
			};
			
			//overwrite the origin function
			var proxy = LocalProxy.createProxy({
				origin: a, 
				callback: cb
			});
			proxy.add(1);
			
			callbackCount.should.equal(1);
			originCallCount.should.equal(1);
			proxy.value.should.equal(value + 1);
			a.value.should.equal(value + 1);
		});
		
		it('should not invoke the origin function if the invoke callback not called', function() {
			var callbackCount = 0;
			var originCallCount = 0;
			var value = 1;
			
			var cb = function(namespace, method, args, invoke) {
				callbackCount++;
			};
			var a = new A(value);
			//overwrite the origin function
			a.add = function(num) {
				originCallCount++;
				this.value += this.value;
			};
			
			var proxy = LocalProxy.createProxy({
				origin: a, 
				callback: cb
			});
			proxy.add(1);
			
			callbackCount.should.equal(1);
			originCallCount.should.equal(0);
			proxy.value.should.equal(value);
			a.value.should.equal(value);
		});
		
		it('should flush the operation result on fields to the origin object', function() {
			var value = 1;
			
			var a = new A(value);
			var proxy = LocalProxy.createProxy({
				origin: a
			});
			
			proxy.value++;
			
			proxy.value.should.equal(value+ 1);
			a.value.should.equal(value + 1);
		});
		
		it('should be ok if create proxies for two objects that references each other', function() {
			var callbackCount = 0;
			var valueA = 1;
			var valueB = 2;
			
			var cb = function(namespace, method, args, invoke) {
				callbackCount++;
				invoke(args);
			};
			var a = new A(valueA);
			var b = new B(valueB);
			
			var proxyA = LocalProxy.createProxy({
				origin: a, 
				callback: cb
			});
			var proxyB = LocalProxy.createProxy({
				origin: b, 
				callback: cb
			});
			a.b = b;
			b.a = a;
			proxyA.addB();
			proxyB.addA();
			
			callbackCount.should.equal(2);
			a.value.should.equal(valueA + 1);
			b.value.should.equal(valueB + 1);
		});
		
		it('should not proxy the internal invoking', function() {
			var callbackCount = 0;
			var value = 1;
			
			var cb = function(namespace, method, args, invoke) {
				console.log(method);
				callbackCount++;
				invoke(args);
			};
			var a = new A(value);
			
			var proxy = LocalProxy.createProxy({
				origin: a, 
				callback: cb
			});
			proxy.addInternal(1);
			
			callbackCount.should.equal(1);
			proxy.value.should.equal(value + 1);
			a.value.should.equal(value + 1);
		});
		
		it('should has the same class info with origin object', function() {
			var a = new A(1);
			
			var proxy = LocalProxy.createProxy({
				origin: a
			});
			
			proxy.should.be.an.instanceof(A);
		});
	});
});
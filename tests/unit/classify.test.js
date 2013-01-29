var module = require('../classify.js');
var classify = module.classify;

var Worker = classify("Worker", {
  static: {
    worker: true
  },
  property: {
    workedTime: 0
  },
  method: {
    getMonthlyPay: function() {
      return 0;
    }
  }
});

var Parttimer = classify("Parttimer", {
  parent: Worker,
  static: {
    partTimer: true
  },
  property: {
    hourlyPay: 800
  },
  method: {
    getMonthlyPay: function() {
      return this.hourlyPay * this.workedTime;
    }
  }
});

var Cook = classify("Cook", {
  parent: Parttimer,
  static: {
    cook: true
  },
  property: {
    advantage: 50
  },
  method: {
    getMonthlyPay : function() {
      return (this.hourlyPay + this.advantage) * this.workedTime;
    }
  }
});

var Waiter = classify("Waiter", {
  parent: Parttimer,
  static: {
    waiter: true
  }
});

exports.testPrototypeChain = function(test) {
  test.expect(11);
  var c = new Cook();
  test.equal(Parttimer.prototype, c.__super__());
  test.equal(Worker.prototype, c.__super__().__super__());
  test.equal(Object.prototype, c.__super__().__super__().__super__());
  test.equal(Cook.prototype, c.__proto__);
  test.equal(Parttimer.prototype, Cook.prototype.__proto__);
  test.equal(Worker.prototype, Parttimer.prototype.__proto__);
  test.equal(Object.prototype, Worker.prototype.__proto__);
  test.equal(null, Object.prototype.__proto__);
  test.equal(Parttimer.prototype, Waiter.prototype.__proto__);
  test.equal(Parttimer.prototype, Cook.prototype.__proto__);
  test.equal(Cook.prototype.__proto__, Waiter.prototype.__proto__);
  test.done();
};

exports.testPropertySearch = function(test) {
  test.expect(15);
  var c = new Cook();
  c.cook = function() { return "Good taste!" };
  test.ok(c.hasOwnProperty("cook"));
  test.ok(c.hasOwnProperty("advantage"));
  test.ok(!c.__proto__.hasOwnProperty("advantage"));
  test.ok(c.hasOwnProperty("hourlyPay"));
  test.ok(!c.__proto__.hasOwnProperty("hourlyPay"));
  test.ok(!c.__proto__.__proto__.hasOwnProperty("hourlyPay"));
  test.ok(c.hasOwnProperty("workedTime"));
  test.ok(!c.__proto__.hasOwnProperty("workedTime"));
  test.ok(!c.__proto__.__proto__.hasOwnProperty("workedTime"));
  test.ok(!c.__proto__.__proto__.__proto__.hasOwnProperty("workedTime"));
  test.ok(!c.hasOwnProperty("getMonthlyPay"));
  test.ok(c.__proto__.hasOwnProperty("getMonthlyPay"));
  test.ok(c.__proto__.__proto__.hasOwnProperty("getMonthlyPay"));
  test.ok(c.__proto__.__proto__.__proto__.hasOwnProperty("getMonthlyPay"));
  test.equal(typeof c.hoge, 'undefined');
  test.done();
};

exports.testClassProperties = function(test) {
  test.expect(10);
  test.ok(!Worker.partTimer);
  test.ok(Parttimer.__super__.worker);
  test.ok(Parttimer.partTimer);
  test.ok(Cook.__super__.__super__.worker);
  test.ok(Cook.__super__.partTimer);
  test.ok(Cook.cook);
  test.ok(!Waiter.cook);
  test.ok(Waiter.__super__.__super__.worker);
  test.ok(Waiter.__super__.partTimer);
  test.ok(Waiter.waiter);
  test.done();
};

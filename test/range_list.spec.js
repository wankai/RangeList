const {describe, expect, test} = require("@jest/globals");
const RangeList = require('../src/range_list.js');
const { spawn } = require('child_process');
const path = require('path');

describe("test range validation", () => {
  test("not array", () => {
    const range_list = new RangeList();
    expect(() => range_list.add("a string")).toThrow();
    expect(() => range_list.add(123)).toThrow();
    expect(() => range_list.add({"name": "john"})).toThrow();
  });
	
  test("array length is not 2", () => {
    const range_list = new RangeList();
    expect(() => range_list.add([1, 3, 4])).toThrow();
    expect(() => range_list.add([1])).toThrow();
  });

  test("array item is not integer", () => {
    const range_list = new RangeList();
    expect(() => range_list.add(["str", 3])).toThrow();
    expect(() => range_list.add([[1, 2], 3])).toThrow();
    expect(() => range_list.add([{"name": "john"}, 3])).toThrow();

    expect(() => range_list.add([3, "str"])).toThrow();
    expect(() => range_list.add([3, [1, 2]])).toThrow();
    expect(() => range_list.add([3, {"name": "john"}])).toThrow();
  });
});

describe("test add(range)", ()=> {
  test('series', () => {
    const range_list = new RangeList();
    expect(range_list.toString()).toBe("");
    range_list.add([1, 5]);
    expect(range_list.toString()).toBe("[1, 5)");
    range_list.add([10, 20]);
    expect(range_list.toString()).toBe("[1, 5) [10, 20)");
    range_list.add([8, 9]);
    expect(range_list.toString()).toBe("[1, 5) [8, 9) [10, 20)");
    range_list.add([9, 10]);
    expect(range_list.toString()).toBe("[1, 5) [8, 20)");
    range_list.add([0, 3]);
    expect(range_list.toString()).toBe("[0, 5) [8, 20)");
  });
});

describe("test remove(range)", ()=> {
  test('series', () => {
    const range_list = new RangeList();
    range_list.add([20, 100]);
    expect(range_list.toString()).toBe("[20, 100)");
    range_list.remove([10, 40]);
    expect(range_list.toString()).toBe("[40, 100)");
    range_list.remove([60, 80]);
    expect(range_list.toString()).toBe("[40, 60) [80, 100)");
    range_list.remove([90, 150]);
    expect(range_list.toString()).toBe("[40, 60) [80, 90)");
  });

  test('remove from empty', () => {
    const range_list = new RangeList();
    range_list.remove([20, 100]);
    expect(range_list.toString()).toBe("");
  });


  test('open end just equal to some close end', () => {
    const range_list = new RangeList();
    range_list.add([10, 15]);
    expect(range_list.toString()).toBe("[10, 15)");
    range_list.add([20, 60]);
    expect(range_list.toString()).toBe("[10, 15) [20, 60)");
    range_list.remove([12, 20]);
    expect(range_list.toString()).toBe("[10, 12) [20, 60)");
  });

  test('mix add and remove', () => {
    const range_list = new RangeList();
    range_list.add([20, 100]);
    expect(range_list.toString()).toBe("[20, 100)");
    range_list.remove([10, 500]);
    expect(range_list.toString()).toBe("");
    range_list.add([60, 80]);
    expect(range_list.toString()).toBe("[60, 80)");
    range_list.remove([60, 70]);
    expect(range_list.toString()).toBe("[70, 80)");
    range_list.add([70, 80]);
    expect(range_list.toString()).toBe("[70, 80)");
  });
});

describe("test print", () => {
  let originalLog = undefined;

  beforeEach(() => {
    originalLog = global.console.log;
    global.console.log = jest.fn();
  });

  afterEach(() => {
    global.console.log = originalLog;
  });

  test("empty", () => {
    const range_list = new RangeList();
    range_list.print();
    expect(global.console.log).toHaveBeenCalledWith("");
  });
	
  test("on range", () => {
    const range_list = new RangeList();
    range_list.add([12, 23]);
    range_list.print();
    expect(global.console.log).toHaveBeenCalledWith("[12, 23)");
  });

  test("two ranges", () => {
    const range_list = new RangeList();
    range_list.add([12, 23]);
    range_list.add([26, 30]);
    range_list.print();
    expect(global.console.log).toHaveBeenCalledWith("[12, 23) [26, 30)");
  });

});

describe("test getValue_(index)", () => {
  test('test common case', () => {
    const range_list = new RangeList([1,4], [5, 8], [10, 14]);
    expect(range_list.getValue_(0)).toBe(1);
    expect(range_list.getValue_(1)).toBe(4);
    expect(range_list.getValue_(2)).toBe(5);
    expect(range_list.getValue_(3)).toBe(8);
    expect(range_list.getValue_(4)).toBe(10);
    expect(range_list.getValue_(5)).toBe(14);
  });

  test('test out of range', ()=> {
    const range_list = new RangeList([1,4], [5, 8], [10, 14]);
    expect(() => range_list.getValue_(-1)).toThrow(TypeError);
    expect(() => range_list.getValue_(100)).toThrow(TypeError);
  });
});

describe('test find_(value)', () => {
  test("common case", () => {
    const range_list = new RangeList([1,4], [5, 8], [10, 14]);
    expect(range_list.find_(0)).toBe(0);
    expect(range_list.find_(1)).toBe(1);
    expect(range_list.find_(2)).toBe(1);
    expect(range_list.find_(3)).toBe(1);
    expect(range_list.find_(4)).toBe(2);
    expect(range_list.find_(5)).toBe(3);
    expect(range_list.find_(6)).toBe(3);
    expect(range_list.find_(7)).toBe(3);
    expect(range_list.find_(8)).toBe(4);
    expect(range_list.find_(9)).toBe(4);
    expect(range_list.find_(10)).toBe(5);
    expect(range_list.find_(11)).toBe(5);
    expect(range_list.find_(12)).toBe(5);
    expect(range_list.find_(13)).toBe(5);
    expect(range_list.find_(14)).toBe(6);
    expect(range_list.find_(15)).toBe(6);
    expect(range_list.find_(16)).toBe(6);
    expect(range_list.find_(20)).toBe(6);
    expect(range_list.find_(200)).toBe(6);
  });

  test("find from empty range list", () => {
    const range_list = new RangeList();
    expect(range_list.find_(1)).toBe(0);
  });

  test("find the number too small", () => {
    const range_list = new RangeList([3,4], [5, 8], [10, 14]);
    expect(range_list.find_(-1)).toBe(0);
  });

  test("find the number too large", () => {
    const range_list = new RangeList([3,4], [5, 8], [10, 14]);
    expect(range_list.find_(20)).toBe(6);
  });
});


describe("test example", () => {
  test('example from jerry.ai', () => {
    const range_list = new RangeList();
    range_list.add([1, 5]);
    expect(range_list.toString()).toBe("[1, 5)");
    range_list.add([10, 20]);
    expect(range_list.toString()).toBe("[1, 5) [10, 20)");
    range_list.add([20, 20]);
    expect(range_list.toString()).toBe("[1, 5) [10, 20)");
    range_list.add([20, 21]);
    expect(range_list.toString()).toBe("[1, 5) [10, 21)");
    range_list.add([2, 4]);
    expect(range_list.toString()).toBe("[1, 5) [10, 21)");
    range_list.add([3, 8]);
    expect(range_list.toString()).toBe("[1, 8) [10, 21)");
    range_list.remove([10, 10]);
    expect(range_list.toString()).toBe("[1, 8) [10, 21)");
    range_list.remove([10, 11]);
    expect(range_list.toString()).toBe("[1, 8) [11, 21)");
    range_list.remove([15, 17]);
    expect(range_list.toString()).toBe("[1, 8) [11, 15) [17, 21)");
    range_list.remove([3, 19]);
    expect(range_list.toString()).toBe("[1, 3) [19, 21)");
  });
});

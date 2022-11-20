/* class Calculator {
  add(a, b) {
    return a + b;
  }

  multiply(a, b) {
    return a * b;
  }
  division(a, b) {
    return a / b;
  }
  subtraction(a, b) {
    return a + b;
  }
}

// epsorto tutto
module.exports = Calculator; */

// Posso anche scrivere

module.exports = class {
  add(a, b) {
    return a + b;
  }

  multiply(a, b) {
    return a * b;
  }
  division(a, b) {
    return a / b;
  }
  subtraction(a, b) {
    return a + b;
  }
};

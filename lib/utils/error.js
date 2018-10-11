'use strict';

module.exports = class MockServerError extends Error {
  constructor (message) {
    super(message)
    this.name = 'MockServerError'
  }
};

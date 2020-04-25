/*
 * utils/utils.mjs
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   File provides utility functions for the crypto exchanges API.
 */


// Function calculates percentage change of two values (current and previous).
//
// Arguments:
// - current: Current value.
// - prev: Previous value.
//
// Returns percentage change of price or N/A if one of the arguments is zero or
// a negative value, which makes the percent change meaningless.
function getPercentageChange(current, prev) {
  if (!current || !prev) {
    return 'N/A';
  }

  // Just to make sure that values are represented in floating point.
  current = parseFloat(current);
  prev = parseFloat(prev);

  // A value of zero or a negative value makes the percent change meaningless.
  if (prev <= 0 || current <= 0) {
    return 'N/A';
  }

  // Percentage Change Formula:
  // ((current - prev) / |prev|) x 100
  const change = ((current - prev) / Math.abs(prev)) * (parseFloat(100));

  return Number(parseFloat(change).toFixed(2));
}



// Function checks if given object has a provided key/property or not.
//
// See ESLint rules for details:
// https://eslint.org/docs/rules/no-prototype-builtins
//
// Arguments:
// - obj: JSON object.
// - key: Provide key, which will be checked.
//
// Returns true if an object has 'key' property, otherwise false.
function hasKey(obj, key) {
  const has = Object.prototype.hasOwnProperty;
  return has.call(obj, String(key));
}



// Function just prints provided data in "[timestamp] error extra_data" format
// using console.error synchronous function.
function Debug(error, extra_data = '') {
  const utc_iso_format = (new Date()).toISOString();
  const error_ts = '[' + utc_iso_format + ']';
  console.error(error_ts, error, extra_data);
}



// Returns a Promise that resolves after "ms" Milliseconds
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}


export {
  getPercentageChange,
  hasKey,
  Debug,
  sleep
};


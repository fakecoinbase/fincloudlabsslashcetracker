/*
 * utils/utils.ts
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
// Returns percentage change or N/A if one of the arguments is zero or
// a negative value, which makes the percent change meaningless.
export function getPercentageChange(current: number, prev: number) {
  if (prev <= 0 || current <= 0) {
    return 'N/A';
  }

  // Percentage Change Formula: ((current - prev) / |prev|) x 100
  const change: number = ((current - prev) / Math.abs(prev)) * 100;

  return Number(change.toFixed(2));
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
export function hasKey(obj: any, key: string) {
  const has = Object.prototype.hasOwnProperty;
  return has.call(obj, String(key));
}


export function hasKeys(object: any, keys: Array<string>) {
  if (!keys.length) return false;

  for (let i = 0; i < keys.length; i++) {
    if (!hasKey(object, keys[i])) return false;
  }

  return true;
}


// Function just prints provided data in "[timestamp] error extra_data" format
// using console.error synchronous function.
export function Debug(error, extra_data = '') {
  const utc_iso_format = (new Date()).toISOString();
  const error_ts = '[' + utc_iso_format + ']';
  console.error(error_ts, error, extra_data);
}


// Returns a Promise that resolves after "ms" Milliseconds
export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

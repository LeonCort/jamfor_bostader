/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accommodations from "../accommodations.js";
import type * as commute from "../commute.js";
import type * as finance from "../finance.js";
import type * as import_ from "../import.js";
import type * as places from "../places.js";
import type * as prefs from "../prefs.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  accommodations: typeof accommodations;
  commute: typeof commute;
  finance: typeof finance;
  import: typeof import_;
  places: typeof places;
  prefs: typeof prefs;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

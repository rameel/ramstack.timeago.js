# @ramstack/timeago
[![NPM](https://img.shields.io/npm/v/@ramstack/timeago)](https://www.npmjs.com/package/@ramstack/timeago)
[![MIT](https://img.shields.io/github/license/rameel/ramstack.timeago.js)](https://github.com/rameel/ramstack.timeago.js/blob/main/LICENSE)

`@ramstack/timeago` is a tiny utility that turns dates into live-updating relative time text like
**"3 minutes ago"** or **"in 2 hours"**.

It automatically tracks elements with `datetime` or `data-datetime`, updates text **only when needed**
(using smart intervals), reacts to DOM changes, and cleans up after itself.

No polling every second. No manual updates.

The library is small enough - around **1.7 KB**, or about **900 bytes gzipped**.

Formatting is handled by the browser using [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat), so the output follows
the browser's locale rules and language data.

## Installation

### Using NPM
```bash
npm install @ramstack/timeago
```

### Using CDN
```html
<script src="https://cdn.jsdelivr.net/npm/@ramstack/timeago@1/timeago.min.js"></script>
```

## Quick start

Just call `timeago()` and pass a selector.
It will find matching elements and start updating them.

```html
<time datetime="2026-01-13T10:00:00Z"></time>
```

```js
import { timeago } from "@ramstack/timeago";

const cleanup = timeago("time");
```

That's it. The text content will update automatically as time passes.

When you no longer need it:

```js
cleanup();
```

## Using a custom locale

By default, the browser's locale is used. You can override it if needed:
```js
timeago(".timeago", { locale: "es" });
```

## How it works (short version)

* Looks for elements matching your selector
* Reads date from `datetime` or `data-datetime`
* Updates text only when needed (smart intervals)
* Watches DOM changes using `MutationObserver`
* Cleans everything up when you call the returned function

No polling every second. No manual updates.

## API

### `timeago(selector, options?)`

Starts tracking elements and returns a cleanup function.

#### Parameters

**`selector` (required)**
A CSS selector for elements that should display relative time.

```js
timeago("[datetime]");
```

**`options` (optional)**

```ts
{
  locale?: string;
}
```

* `locale` — locale code for formatting (`"en"`, `"fr"`, `"ru"`, etc.)
* Defaults to the browser's locale

#### Returns

A function that stops all updates and disconnects the observer.

```js
const cleanup = timeago(".timeago");

// later
cleanup();
```

## Supported date formats

The date value can be:

* An ISO date string

  ```html
  <time datetime="2026-01-13T10:00:00Z"></time>
  ```
* A unix timestamp in milliseconds

  ```html
  <span data-datetime="1705140000"></span>
  ```

If the date is invalid, the element is ignored.


## Source Code
You can find the source code for this plugin:

https://github.com/rameel/ramstack.timeago.js/blob/main/src/timeago.ts

## Contributions
Bug reports and contributions are welcome.

## License
This package is released as open source under the **MIT License**.
See the [LICENSE](https://github.com/rameel/ramstack.timeago.js/blob/main/LICENSE) file for more details.

# mw-bucketjs

## Usage
Refer to lua usage: https://meta.weirdgloop.org/w/Extension:Bucket/Usage

Library mimicks lua usage, with the exception of lua tables replaced by js arrays.
```js
import bucket from 'mw-bucketjs';

const query = bucket('character')
	.select('page_name', 'id', 'image', 'release_timestamp')
	.where(
		bucket.Not('Category:Beta content'),
		['release_timestamp', '<', Date.now()]
	)
	.orderBy('release_timestamp', 'asc')
	.limit(10)
const data = await query.run()
```

## Dev
To install dependencies:

```bash
bun install
```

To build:

```bash
bun run build
```

This project was created using `bun init` in bun v1.3.11. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

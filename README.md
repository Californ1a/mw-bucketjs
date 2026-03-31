# mw-bucketjs
Javascript wrapper for creating Bucket query strings.

## Usage
Refer to lua usage: https://meta.weirdgloop.org/w/Extension:Bucket/Usage

Library mimicks lua usage, with the exception of lua tables replaced by js arrays.
```js
import bucket from 'mw-bucketjs';

const query = bucket('character')
	.select('page_name', 'id', 'image', 'release_timestamp')
	.where(
		bucket.Not('Category:Beta content'),
		['release_timestamp', '<', 1774000000000]
	)
	.orderBy('release_timestamp', 'asc')
	.limit(10);

// Returns the string for the query:
const queryString = query.build();
// "bucket('character').select('page_name','id','image','release_timestamp').where(bucket.Not('Category:Beta content'),{'release_timestamp','<',1774000000000}).orderBy('release_timestamp','asc').limit(10)"

// Sends the api request and returns the bucket data:
const data = await query.run();
// [
//   {"page_name": "John", "id": 1, "image": "File:John.png", "release_timestamp": 1771000000000},
//   {"page_name": "Luke", "id": 2, "image": "File:Luke.png", "release_timestamp": 1772000000000},
//   {"page_name": "Jane", "id": 3, "image": "File:Jane.png", "release_timestamp": 1773000000000},
// ]
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

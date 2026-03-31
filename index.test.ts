import { describe, expect, test, mock, beforeEach, afterAll, beforeAll } from 'bun:test';
import bucket from './index';

let originalMw: any;
let originalFetch: any;
function setupMwMock() {
	originalMw = (global as any).mw;
	(global as any).mw = {
		Api: mock().mockImplementation(() => ({
			get: mock().mockResolvedValue({
				bucket: [
					{
						id: 1,
						name: 'John Doe',
					},
				],
			}),
		})),
	};
}
function setupFetchMock() {
	originalFetch = (global as any).fetch;
	(global as any).fetch = mock().mockResolvedValue({
		json: mock().mockResolvedValue({
			bucket: [
				{
					id: 2,
					name: 'John Doe',
				},
			],
		}),
	});
}

describe('basic queries', () => {
	beforeAll(() => {
		setupMwMock();
	});

	test('simple query', () => {
		const q = bucket('users')
			.select('id', 'name')
			.where(['id', '>', 0])
			.limit(10);
		expect(q.build()).toBe(`bucket('users').select('id','name').where({'id','>',0}).limit(10).run()`);
	});

	test('complex query', () => {
		const q = bucket('orders')
			.select('id', 'total')
			.where(['id', '>', 0])
			.where(['total', '>', 100])
			.orderBy('total', 'desc')
			.limit(10);
		expect(q.build()).toBe(`bucket('orders').select('id','total').where({'id','>',0}).where({'total','>',100}).orderBy('total','desc').limit(10).run()`);
	});

	test('join query', () => {
		const q = bucket('orders')
			.join('users', 'users.id', 'orders.user_id')
			.select('id', 'total')
			.where(['id', '>', 0])
			.where(['total', '>', 100])
			.orderBy('total', 'desc')
			.limit(10);
		expect(q.build()).toBe(`bucket('orders').join('users','users.id','orders.user_id').select('id','total').where({'id','>',0}).where({'total','>',100}).orderBy('total','desc').limit(10).run()`);
	});

	afterAll(() => {
		(global as any).mw = originalMw;
	});
});

describe('conditions', () => {
	beforeAll(() => {
		setupMwMock();
	});

	test('null condition', () => {
		const q = bucket('users')
			.select('id', 'name')
			.where(bucket.Null());
		expect(q.build()).toBe(`bucket('users').select('id','name').where(bucket.Null()).run()`);
	});

	test('not condition', () => {
		const q = bucket('products')
			.select('id', 'name')
			.where(bucket.Not(['price', '>', 100]));
		expect(q.build()).toBe(`bucket('products').select('id','name').where(bucket.Not({'price','>',100})).run()`);
	});

	test('and condition', () => {
		const q = bucket('orders')
			.select('id', 'total')
			.where(bucket.And(['status', '=', 'pending'], ['total', '>', 100]));
		expect(q.build()).toBe(`bucket('orders').select('id','total').where(bucket.And({'status','=','pending'},{'total','>',100})).run()`);
	});

	test('or condition', () => {
		const q = bucket('products')
			.select('id', 'name')
			.where(bucket.Or(['price', '>', 100], 'Category:Electronics'));
		expect(q.build()).toBe(`bucket('products').select('id','name').where(bucket.Or({'price','>',100},'Category:Electronics')).run()`);
	});

	test('complex nested conditions', () => {
		const q = bucket('orders')
			.select('id', 'total')
			.where(bucket.Or(['status', '=', 'pending'], bucket.And(['total', '>', 100], 'Category:Electronics')));
		expect(q.build()).toBe(`bucket('orders').select('id','total').where(bucket.Or({'status','=','pending'},bucket.And({'total','>',100},'Category:Electronics'))).run()`);
	});

	afterAll(() => {
		(global as any).mw = originalMw;
	});
});

describe('run', () => {
	beforeAll(() => {
		setupMwMock();
	});

	test('run query', async () => {
		const q = bucket('users')
			.select('id', 'name')
			.where(['id', '>', 0])
			.limit(10);
		expect(q.build()).toBe(`bucket('users').select('id','name').where({'id','>',0}).limit(10).run()`);
		expect(await q.run()).toEqual([{ id: 1, name: 'John Doe' }]);
	});

	afterAll(() => {
		(global as any).mw = originalMw;
	});
});

describe('config', () => {
	beforeAll(() => {
		setupFetchMock();
	});

	test('custom API path', async () => {
		bucket.Config({
			wgServer: 'https://example.com',
			wgScriptPath: '/w',
		});
		const q = bucket('users')
			.select('id', 'name')
			.where(['id', '>', 0])
			.limit(10);
		expect(q.build()).toBe(`bucket('users').select('id','name').where({'id','>',0}).limit(10).run()`);
		expect(await q.run()).toEqual([{ id: 2, name: 'John Doe' }]);
	});

	afterAll(() => {
		(global as any).fetch = originalFetch;
	});
});

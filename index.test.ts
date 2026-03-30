import { describe, expect, test, mock } from 'bun:test';
import bucket from './index';

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

describe('basic queries', () => {
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
});

describe('conditions', () => {
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
});

describe('run', () => {
	test('run query', async () => {
		const q = bucket('users')
			.select('id', 'name')
			.where(['id', '>', 0])
			.limit(10);
		expect(q.build()).toBe(`bucket('users').select('id','name').where({'id','>',0}).limit(10).run()`);
		expect(await q.run()).toEqual([{ id: 1, name: 'John Doe' }]);
	});
});

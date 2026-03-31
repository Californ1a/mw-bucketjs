type RowFor<TFields extends string> = Record<TFields, unknown>;
type Raw = { __raw: true; value: string };
type Operand = '=' | '!=' | '>=' | '<=' | '>' | '<';
type Condition<TField = string> = 
	| `Category:${string}`
	| Raw
	| [TField, string | number]
	| [TField, Operand, string | number];
type BucketConfig = {
	wgServer?: string;
	wgScriptPath?: string;
	apiPath?: string;
}
type BucketFn = {
	(name: string): BucketQuery;

	Config: (config: BucketConfig) => void;

	Or: (...conds: Condition<string>[]) => Raw;
	And: (...conds: Condition<string>[]) => Raw;
	Not: (cond: Condition<string>) => Raw;
	Null: () => Raw;
};

const defaultConfig: Required<BucketConfig> = {
	wgServer: '',
	wgScriptPath: '',
	apiPath: '/api.php',
}
let currentConfig = { ...defaultConfig };

class BucketQuery<TFields extends string = never> {
	private bucketName: string;
	private parts: string[] = [];
	private currentConfig: Required<BucketConfig>;

	constructor(bucketName: string) {
		this.bucketName = bucketName;
		this.currentConfig = { ...currentConfig };
	}

	select<const TNewFields extends readonly string[]>(
		...fields: TNewFields
	): BucketQuery<TFields | TNewFields[number]> {
		const args = fields.map(v => `'${v}'`).join(',');
		this.parts.push(`select(${args})`);
		return this as unknown as BucketQuery<TFields | TNewFields[number]>;
	}

	where(...conditions: Condition<TFields>[]) {
		const conds = conditions.map(serializeCondition).join(',');
		this.parts.push(`where(${conds})`);
		return this;
	}

	join(bucket: string, a: string, b: string) {
		this.parts.push(`join('${bucket}','${a}','${b}')`);
		return this;
	}

	limit(n: number) {
		this.parts.push(`limit(${n})`);
		return this;
	}

	offset(n: number) {
		this.parts.push(`offset(${n})`);
		return this;
	}

	orderBy(field: TFields, dir: 'desc' | 'asc') {
		this.parts.push(`orderBy('${field}','${dir}')`);
		return this;
	}

	build() {
		return `bucket('${this.bucketName}').${this.parts.join('.')}.run()`;
	}

	async run(): Promise<RowFor<TFields>[]> {
		const query = this.build();
		try {
			let data;
			if (typeof mw === 'undefined' && typeof fetch === 'function') {
				const res = await fetch(getApiUrl(this.currentConfig), {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						action: 'bucket',
						query: query,
						formatversion: 2
					})
				});
				data = await res.json();
			} else if (typeof mw === 'object' && typeof mw.Api === 'function') {
				data = await (new mw.Api()).get({
					action: 'bucket',
					query: query,
					formatversion: 2,
				});
			}
			if (data && data.bucket && data.bucket.length > 0) {
				return data.bucket as RowFor<TFields>[];
			} else {
				return [] as RowFor<TFields>[];
			}
		} catch (e) {
			throw new Error(`Failed to execute bucket query: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
}

function serializeCondition(cond: Condition<string>) {
	if (typeof cond === 'string') {
		return `'${cond}'`;
	}

	if (Array.isArray(cond)) {
		const condParts = cond.map(v => {
			return (typeof v === 'string') ? `'${v}'` : v;
		});
		return `{${condParts.join(',')}}`;
	}

	if (typeof cond === 'object' && cond.__raw) {
		return cond.value;
	}
}

// Prevent wrapping raw conditions in quotes
function raw(value: string): Raw {
	return { __raw: true, value }
}

function getApiUrl(config?: Required<BucketConfig>) {
	config = config || currentConfig;
	if (config.apiPath.startsWith('http')) {
		return config.apiPath;
	}

	return `${config.wgServer}${config.wgScriptPath}${config.apiPath}`;
}

const bucket: BucketFn = function(name) {
	return new BucketQuery(name);
};

bucket.Config = (config) => {
	currentConfig = { ...currentConfig, ...config };
};

bucket.Or = (...conds) => {
	return raw(`bucket.Or(${conds.map(serializeCondition).join(',')})`);
};
bucket.And = (...conds) => {
	return raw(`bucket.And(${conds.map(serializeCondition).join(',')})`);
};
bucket.Not = (cond) => {
	return raw(`bucket.Not(${serializeCondition(cond)})`);
};
bucket.Null = () => {
	return raw(`bucket.Null()`);
};

export default bucket;

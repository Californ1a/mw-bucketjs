import bucket from './index';

(function() {
	if (typeof window === 'undefined') {
		(global as any).bucket = bucket;
	} else if (typeof window !== 'undefined' && typeof mw === 'undefined') {
		(window as any).bucket = bucket;
	} else if (typeof mw !== 'undefined') {
		(mw as any).bucket = bucket;
	}
})();

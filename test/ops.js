/* eslint-env node, mocha */
const assert = require('assert');
const IcepickStyle = require('..');

describe('ops', () => {
	it('constructor(undefined)', () => {
		const style = new IcepickStyle();
		assert.strictEqual(style.history.length, 1);
		assert.deepStrictEqual(style.current, {
			version: 8,
			sources: {},
			layers: []
		});
	});

	it('constructor([style])', () => {
		const style = new IcepickStyle({
			version: 8,
			sources: {},
			layers: [],
			center: [0.111, 1.111]
		});

		assert.strictEqual(style.history.length, 1);
		assert.deepStrictEqual(style.current, {
			version: 8,
			sources: {},
			layers: [],
			center: [0.111, 1.111]
		});
	});

	describe('constructor([invalid])', () => {
		it('invalid layers', () => {
			assert.throws(
				() => {
					new IcepickStyle({ // eslint-disable-line no-new
						sources: {},
						layers: {}
					});
				},
				{
					name: 'TypeError',
					message: 'style.layers must be an array'
				}
			);
		});

		it('invalid sources', () => {
			assert.throws(
				() => {
					new IcepickStyle({ // eslint-disable-line no-new
						sources: [],
						layers: []
					});
				},
				{
					name: 'TypeError',
					message: 'style.sources must be an object'
				}
			);
		});
	});

	it('canUndo()', () => {
		const style = new IcepickStyle({
			version: 8,
			sources: {},
			layers: []
		});

		assert.strictEqual(style.canUndo(), false);
		style.modifyRoot('name', 'foo bar');
		assert.strictEqual(style.canUndo(), true);
	});

	it('undo()', () => {
		const style = new IcepickStyle({
			version: 8,
			sources: {},
			layers: []
		});

		style.modifyRoot('name', 'foo bar');
		assert.deepStrictEqual(style.current, {
			version: 8,
			sources: {},
			layers: [],
			name: 'foo bar'
		});
		style.undo();
		assert.deepStrictEqual(style.current, {
			version: 8,
			sources: {},
			layers: []
		});
		assert.strictEqual(style.canUndo(), false);
	});

	it('undo() past stack', () => {
		const style = new IcepickStyle({
			version: 8,
			sources: {},
			layers: []
		});

		style.modifyRoot('name', 'foo bar');
		style.undo();

		let err;
		try {
			style.undo();
		} catch (error) {
			err = error;
		}

		assert(err);
		assert.strictEqual(err.message, 'No items to undo in stack');
	});

	it('canRedo()', () => {
		const style = new IcepickStyle({
			version: 8,
			sources: {},
			layers: []
		});

		style.modifyRoot('name', 'foo bar');
		style.undo();
		assert.strictEqual(style.canRedo(), true);
	});

	it('redo()', () => {
		const style = new IcepickStyle({
			version: 8,
			sources: {},
			layers: []
		});

		style.modifyRoot('name', 'foo bar');
		style.undo();
		assert.deepStrictEqual(style.current, {
			version: 8,
			sources: {},
			layers: []
		});
		style.redo();
		assert.deepStrictEqual(style.current, {
			version: 8,
			sources: {},
			layers: [],
			name: 'foo bar'
		});
	});

	it('redo() beyond stack', () => {
		const style = new IcepickStyle({
			version: 8,
			sources: {},
			layers: []
		});

		style.modifyRoot('name', 'foo bar');
		style.undo();
		style.redo();

		let err;
		try {
			style.redo();
		} catch (error) {
			err = error;
		}

		assert(err);
		assert(err.message, 'No items to redo in stack');
	});

	it('merge()', () => {
		const style = new IcepickStyle({
			version: 8,
			sources: {},
			layers: [],
			metadata: {
				foo: {bar: 1}
			}
		});
		assert.strictEqual(style.history.length, 1);
		style.merge({
			metadata: {
				baz: 'text'
			}
		});
		assert.strictEqual(style.history.length, 2);
		assert.deepStrictEqual(style.current, {
			version: 8,
			sources: {},
			layers: [],
			metadata: {
				foo: {bar: 1},
				baz: 'text'
			}
		});

		assert.strictEqual(style.current.sources, style.history[0].style.sources);
		assert.strictEqual(style.current.layers, style.history[0].style.layers);
		assert.notStrictEqual(style.current.metadata, style.history[0].style.metadata);
		assert.strictEqual(
			style.current.metadata.foo,
			style.history[0].style.metadata.foo
		);
	});

	it('stack(idx)', () => {
		const style = new IcepickStyle({
			layers: [],
			sources: {},
			zoom: 10
		});

		style.modifyRoot('zoom', 11);
		style.modifyRoot('zoom', 12);
		style.modifyRoot('zoom', 13);

		assert.strictEqual(style.stack(-1).style.zoom, 12);
		assert.strictEqual(style.stack(-2).style.zoom, 11);
		assert.strictEqual(style.stack(-3).style.zoom, 10);

		assert.strictEqual(style.stack(0).style.zoom, 10);
		assert.strictEqual(style.stack(1).style.zoom, 11);
		assert.strictEqual(style.stack(2).style.zoom, 12);
		assert.strictEqual(style.stack(3).style.zoom, 13);
	});

	it('replace()', () => {
		const style = new IcepickStyle({
			version: 8,
			sources: {
				foo: {
					type: 'raster'
				}
			},
			layers: [],
			metadata: {
				foo: {bar: 1},
				bar: {test: 1}
			}
		});
		assert.strictEqual(style.history.length, 1);
		style.replace({
			metadata: {
				baz: 'text',
				bar: {test: 1}
			}
		});
		assert.strictEqual(style.history.length, 2);
		assert.deepStrictEqual(style.current, {
			version: 8,
			sources: {},
			layers: [],
			metadata: {
				baz: 'text',
				bar: {test: 1}
			}
		});

		assert.notStrictEqual(style.current.metadata, style.history[0].style.metadata);
		assert.strictEqual(
			style.current.metadata.bar,
			style.history[0].style.metadata.bar
		);
	});

	it('chainable', () => {
		const style = new IcepickStyle();
		assert.strictEqual(style, style.addRoot('foo', {}));
		assert.strictEqual(style, style.modifyRoot('foo', {}));
		assert.strictEqual(style, style.removeRoot('foo'));
		assert.strictEqual(style, style.addLayer('foo', {type: 'background'}));
		assert.strictEqual(style, style.modifyLayer('foo', {type: 'background'}));
		assert.strictEqual(style, style.renameLayer('foo', 'bar'));
		assert.strictEqual(style, style.removeLayer('bar'));
		assert.strictEqual(style, style.addSource('foo', {type: 'raster'}));
		assert.strictEqual(style, style.modifySource('foo', {type: 'raster'}));
		assert.strictEqual(style, style.renameSource('foo', 'bar'));
		assert.strictEqual(style, style.removeSource('bar'));
	});
});

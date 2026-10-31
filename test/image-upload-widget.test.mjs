import React from 'react';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { outputText } = ts.transpileModule(
  readFileSync(new URL('../src/components/sc_widgets/image-upload/image-upload-widget.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } },
);
const loaded = { exports: {} };
new Function('require', 'module', 'exports', outputText)((name) => {
  if (name === '@/components/ui/button') return { Button: ({ children }) => React.createElement('button', null, children) };
  if (name === '@/components/ui/input') return { Input: () => null };
  if (name === '@/components/ui/progress') return { Progress: ({ value }) => React.createElement('progress', { value, max: 100 }) };
  if (name === '@/utils/cn') return { cn: (...args) => args.filter(Boolean).join(' ') };
  if (name.endsWith('/use-object-url')) return { useObjectUrl: () => null };
  if (name.endsWith('/image-with-loader')) return { ImageWithLoader: () => null };
  if (name.endsWith('/image-reposition-dialog')) return { ImageRepositionDialog: () => null };
  if (name.endsWith('/image-crop')) return { calculateImageCrop: () => undefined };
  return require(name);
}, loaded, loaded.exports);
const render = (props) => renderToStaticMarkup(React.createElement(loaded.exports.ImageUploadWidget, {
  aspectRatio: 1, label: 'Avatar', shape: 'circle', variant: 'avatar',
  file: null, onChange() {}, onCropChange() {}, ...props,
}));

test('empty and unchanged image fields show no upload state during form submission', () => {
  for (const existingPreviewUrl of [undefined, 'https://test.invalid/current.jpg']) {
    const html = render({ existingPreviewUrl, processing: true, uploadProgress: { phase: 'processing' } });
    assert.doesNotMatch(html, /Processing image|role="status"|65%/);
  }
});

test('only measured transfer bytes display a percentage', () => {
  const file = { name: 'selected.jpg' };
  const html = render({ file, processing: true, uploadProgress: { phase: 'uploading', loaded: 40, total: 100, percent: 40 } });
  assert.match(html, /40%/);
  assert.match(html, /Uploading image/);
  for (const phase of ['preparing', 'processing']) {
    const indeterminate = render({ file, processing: true, uploadProgress: { phase } });
    assert.doesNotMatch(indeterminate, /\d+%|<progress/);
    assert.match(indeterminate, /role="status"/);
  }
});

test('legacy processing without measured progress remains indeterminate', () => {
  const html = render({ file: { name: 'selected.jpg' }, processing: true });
  assert.match(html, /Processing image/);
  assert.doesNotMatch(html, /65%|<progress/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { editorialUrl, editorialSrcSet, imageUploadError } from '../src/domain/editorialSafety.ts';

test('editorial links reject executable protocols, credentials and ambiguous paths', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,test', '//example.com', '/\\example.com', 'https://user:password@example.com', 'https://example.com/\n', 'https://example.com/"test']) {
    assert.equal(editorialUrl(value, true), undefined, value);
  }
  assert.equal(editorialUrl('/blog#licoes', true), '/blog#licoes');
  assert.equal(editorialUrl('/blog'), undefined);
  assert.equal(editorialUrl('https://example.com/book'), 'https://example.com/book');
});
test('editorial responsive images only accept safe URLs and width descriptors', () => {
  assert.equal(editorialSrcSet('/images/a.webp 480w, /images/b.webp 900w'), '/images/a.webp 480w, /images/b.webp 900w');
  assert.equal(editorialSrcSet('data:image/svg+xml,bad 480w'), undefined);
});
test('image uploads enforce the bucket size and MIME rules before network access', () => {
  assert.equal(imageUploadError({ type: 'image/webp', size: 1024 }), null);
  assert.ok(imageUploadError({ type: 'image/svg+xml', size: 1024 }));
  assert.ok(imageUploadError({ type: 'image/png', size: 6 * 1024 * 1024 }));
  assert.ok(imageUploadError({ type: 'image/png', size: 0 }));
});

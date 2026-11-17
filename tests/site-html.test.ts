import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeDocument } from '../scripts/verify-site.mjs';

const page =
  '<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'"></head><body><a href="/ja/">Home</a><a href="https://github.com/TaigaShinohara/D-Apps-Platform">Source</a></body></html>';

test('built pages reject meta refresh at any delay', () => {
  for (const delay of ['0', '30']) {
    assert.throws(
      () =>
        assertSafeDocument(
          `<meta http-equiv="refresh" content="${delay};url=https://example.com">`,
          'page.html',
        ),
      /Meta refresh/,
    );
  }
  assert.throws(
    () =>
      assertSafeDocument(
        '<meta content="5; URL=/ja/" http-equiv="Refresh">',
        'page.html',
      ),
    /Meta refresh/,
  );
});

test('built pages reject dangerous link schemes and keep ordinary links', () => {
  for (const href of [
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,hi',
    'vbscript:msgbox',
    'blob:https://example.com/id',
    'file:///tmp/x',
    'javascript&#58;alert(1)',
    'javascript&colon;alert(1)',
    'jav&#97;script:alert(1)',
    'jav&#x61;script:alert(1)',
    'd&#97;ta:text/html,hello',
    'vb&#115;cript:msgbox',
    'java&#9;script:alert(1)',
    'java&#x09;script:alert(1)',
    'javascript&amp;colon;alert(1)',
  ]) {
    assert.throws(
      () => assertSafeDocument(`<a href="${href}">x</a>`, 'page.html'),
      /Disallowed link scheme/,
    );
  }
  assert.throws(
    () =>
      assertSafeDocument(
        '<img srcset="data:image/gif;base64,R0lG 1x">',
        'page.html',
      ),
    /Disallowed link scheme/,
  );
  assert.doesNotThrow(() => assertSafeDocument(page, 'page.html'));
  assert.doesNotThrow(() =>
    assertSafeDocument('<a href="/ja/?q=&#97;">x</a>', 'page.html'),
  );
});

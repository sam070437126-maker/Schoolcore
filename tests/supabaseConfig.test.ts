import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeSupabaseUrl,
  sanitizeSupabaseKey,
  resolveSupabaseConfig,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from '../src/lib/supabaseConfig.ts';
import { getSupabaseClient } from '../src/lib/supabaseClient.ts';

describe('Supabase Configuration and URL Sanitizer', () => {
  test('handles malformed URL with leading equals sign (=https://...)', () => {
    const raw = '=https://vpkxkmglbzqyfgvoizjs.supabase.co';
    const sanitized = sanitizeSupabaseUrl(raw);
    assert.strictEqual(sanitized, 'https://vpkxkmglbzqyfgvoizjs.supabase.co');
  });

  test('handles malformed URL with multiple equals and quotes', () => {
    const raw = '=="https://vpkxkmglbzqyfgvoizjs.supabase.co"';
    const sanitized = sanitizeSupabaseUrl(raw);
    assert.strictEqual(sanitized, 'https://vpkxkmglbzqyfgvoizjs.supabase.co');
  });

  test('falls back safely when an API key was mistakenly assigned to the URL variable', () => {
    const rawKeyAsUrl = 'sb_publishable_UG0DxyzhN5LGS9PdJnlbnw_TbJpw9NO';
    const sanitized = sanitizeSupabaseUrl(rawKeyAsUrl);
    assert.strictEqual(sanitized, DEFAULT_SUPABASE_URL);
  });

  test('adds https:// protocol if omitted', () => {
    const rawNoProto = 'vpkxkmglbzqyfgvoizjs.supabase.co';
    const sanitized = sanitizeSupabaseUrl(rawNoProto);
    assert.strictEqual(sanitized, 'https://vpkxkmglbzqyfgvoizjs.supabase.co');
  });

  test('removes trailing slashes from URLs', () => {
    const rawTrailing = 'https://vpkxkmglbzqyfgvoizjs.supabase.co///';
    const sanitized = sanitizeSupabaseUrl(rawTrailing);
    assert.strictEqual(sanitized, 'https://vpkxkmglbzqyfgvoizjs.supabase.co');
  });

  test('handles null, undefined, and empty string', () => {
    assert.strictEqual(sanitizeSupabaseUrl(null), DEFAULT_SUPABASE_URL);
    assert.strictEqual(sanitizeSupabaseUrl(undefined), DEFAULT_SUPABASE_URL);
    assert.strictEqual(sanitizeSupabaseUrl(''), DEFAULT_SUPABASE_URL);
    assert.strictEqual(sanitizeSupabaseUrl('   '), DEFAULT_SUPABASE_URL);
  });

  test('sanitizes Supabase key and strips invalid characters', () => {
    assert.strictEqual(
      sanitizeSupabaseKey('="sb_publishable_test_key_12345678"'),
      'sb_publishable_test_key_12345678'
    );
    // When a URL was mistakenly supplied as key
    assert.strictEqual(
      sanitizeSupabaseKey('https://vpkxkmglbzqyfgvoizjs.supabase.co'),
      DEFAULT_SUPABASE_ANON_KEY
    );
  });

  test('resolveSupabaseConfig returns valid HTTP/HTTPS URLs', () => {
    const config = resolveSupabaseConfig();
    assert.ok(config.url.startsWith('http://') || config.url.startsWith('https://'));
    assert.doesNotThrow(() => new URL(config.url));
  });

  test('getSupabaseClient initializes without throwing Uncaught Error', () => {
    assert.doesNotThrow(() => {
      const client = getSupabaseClient();
      assert.ok(client);
    });
  });
});

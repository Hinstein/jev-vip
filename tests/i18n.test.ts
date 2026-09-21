import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLocaleFromPathname,
  localizedPath,
  stripLocalePrefix,
} from '../lib/i18n/config';

test('locale-aware paths add and preserve the locale prefix', () => {
  assert.equal(localizedPath('zh-CN', '/dashboard'), '/zh-CN/dashboard');
  assert.equal(
    localizedPath('zh-CN', '/sign-in?redirect=%2Fredeem'),
    '/zh-CN/sign-in?redirect=%2Fredeem'
  );
  assert.equal(localizedPath('en', '/zh-CN/dashboard'), '/zh-CN/dashboard');
  assert.equal(localizedPath('zh-CN', '/api/user'), '/api/user');
});

test('locale prefixes can be read and removed for route matching', () => {
  assert.equal(getLocaleFromPathname('/zh-CN/dashboard'), 'zh-CN');
  assert.equal(getLocaleFromPathname('/dashboard'), null);
  assert.equal(stripLocalePrefix('/zh-CN/dashboard'), '/dashboard');
  assert.equal(stripLocalePrefix('/zh-CN'), '/');
});

// 注册localStorage方法
// 使用方式 <%= storage('key') %>
hexo.extend.helper.register('storage', function (key, value) {
  if (value) {
    return localStorage.setItem(key, value);
  }
  return localStorage.getItem(key);
})

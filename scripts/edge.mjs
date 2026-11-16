// CloudFront Functions source is generated from fixed build output, never visitor input.
export function requestFunctionSource({ headers, routes, downloads, revoked }) {
  return `var headers=${JSON.stringify(headers)};var routes=${JSON.stringify(routes)};var downloads=${JSON.stringify(downloads)};var revoked=${JSON.stringify(revoked)};
function reply(status,body,location){var h={};Object.keys(headers).forEach(function(k){h[k]={value:headers[k]};});h['content-type']={value:'text/html; charset=utf-8'};h['cache-control']={value:'no-store'};if(location)h.location={value:location};return {statusCode:status,headers:h,body:body};}
function handler(event){var r=event.request;var host=r.headers.host&&r.headers.host.value;var p=r.uri;
if(r.method!=='GET'&&r.method!=='HEAD')return reply(405,'Method not allowed');
if(host!=='deepledeeple.com'&&host!=='www.deepledeeple.com')return reply(403,'Forbidden');
if(p.indexOf('%')!==-1||p.indexOf('..')!==-1||p.indexOf('\\\\')!==-1||p.indexOf('//')!==-1)return reply(404,'Not found');
if(host==='www.deepledeeple.com')return reply(308,'','https://deepledeeple.com'+p);
if(p==='/')return reply(302,'','/ja/');
if(revoked.indexOf(p)!==-1)return reply(410,'This download is no longer available.');
if(p.indexOf('/downloads/')===0){if(downloads.indexOf(p)===-1)return reply(404,'Download not found');}
else if(routes[p]){r.uri=routes[p];}
else if(routes[p+'/'])return reply(308,'',p+'/');
else return reply(404,'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Not found | D-Apps</title><h1>Page not found</h1><p><a href="/ja/" lang="ja">日本語のホームへ</a> · <a href="/en/">English home</a></p></html>');
r.querystring={};r.cookies={};delete r.headers.cookie;return r;}`;
}
export function responseFunctionSource(headers) {
  return `var headers=${JSON.stringify(headers)};function handler(event){var r=event.response;Object.keys(headers).forEach(function(k){r.headers[k]={value:headers[k]};});delete r.cookies;return r;}`;
}

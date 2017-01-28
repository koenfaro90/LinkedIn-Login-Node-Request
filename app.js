var request = require('request');
var Promise = require('bluebird');
var _ = require('underscore');
var fs = require('fs');
var cheerio = require('cheerio');
var config = JSON.parse(fs.readFileSync('config.json').toString());

class LinkedIn {
	constructor() {
		this.cookieJar = request.jar();
		this.request = request.defaults({
			jar: this.cookieJar}
		);
		this.login();
	}
	login() {
		this._get(config.baseUrl)
			.then((body) => {
				console.log('Retrieved clean login page');
				return this._post(config.baseUrl + '/uas/login-submit', {
					session_key: config.username,
					session_password: config.password,
					isJsEnabled: 'false',
					loginCsrfParam: this._getInput(body, 'loginCsrfParam'),
					sourceAlias: this._getInput(body, 'sourceAlias')
				});
			})
			.then((body) => {
				// We will be redirected around a couple of times - but will have proper cookies in place for the next request to be authenticated
				console.log('After logging in');
				return this._get(config.baseUrl);
			})
			.then((body) => {
				console.log('This should have your name on it, writing to authenticated.html');
				fs.writeFileSync('authenticated.html', body);
			})
			.then(() => {
				process.exit();
			})
	}
	_get(url) {
		return new Promise((resolve, reject) => {
			this.request({
				url: url,
				method: 'GET'
			}, (err, resp, body) => {
				if (err) {
					return reject(err);
				}
				return resolve(body);
			});
		});
	}
	_post(url, data) {
		console.log('_post', url, data);
		return new Promise((resolve, reject) => {
			this.request({
				url: url,
				method: 'POST',
				form: data
			}, (err, resp, body) => {
				if (err) {
					return reject(err);
				}
				return resolve(body);
			});
		});
	}
	_getCookie(url, name) {
		// Turns out to be obsolete =)
		var cookies = {};
		var wrappedCookies = this.cookieJar.getCookieString(url).split('; ');
		_.each(wrappedCookies, (itm) => {
				var cookieKey = itm.substr(0, itm.indexOf('='));
				var cookieValue = itm.replace(cookieKey + '=', '').trim('"');
				cookies[cookieKey] = cookieValue;
		})
		console.log('_getCookie parsedCookies', cookies);
		return cookies[name];
	}
	_getInput(data, name) {
		var $ =  cheerio.load(data);
		var value = $('input[name="'+name+'"]').val();
		return value;
	}
}

var linkedIn = new LinkedIn();

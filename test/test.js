/**
 * Created by JiaHao on 18/8/15.
 */

var async = require('async');
var chai = require('chai');
var assert = chai.assert;

var phantomBase = require('./../lib/phantomBase');
var PhantomBrowser = require('./../lib/PhantomBrowser');

const testUrls = ['http://apple.com', 'https://www.facebook.com/', 'http://skewedlines.github.io/ajax-test-page/'];
const INVALID_URL = 'http://insdasjdlkas.com/';

describe('Testing base PhantomJS functions', function () {
    this.timeout(50000);
    it('Can open pages', function (done) {

        async.each(testUrls, function (testUrl, callback) {
            phantomBase.openPage(testUrl, function (error, page, ph) {
                ph.exit();
                callback(error);
            });
        }, function (error) {
            assert.notOk(error, 'No error should be received when opening pages');
            done(error);
        });
    });

    it('Can fail to open pages gracefully', function (done) {

        phantomBase.openPage(INVALID_URL, function (error, page, ph) {
            ph.exit();
            assert.ok(error, 'An error should be received when opening pages');
            done();
        });
    });
});

describe('Testing PhantomBrowser Object', function () {
    this.timeout(30000);

    describe('Basic tasks', function () {

        it('Can open pages (Node style callback)', function (done) {
            async.each(testUrls, function (testUrl, callback) {

                var browser = new PhantomBrowser();
                browser.openPage(testUrl, function (error) {
                    browser.done();
                    callback(error);
                });

            }, function (error) {
                assert.notOk(error, 'No error should be received when opening a valid page.');
                done(error);
            });
        });

        it('Can do tasks sequentially and get a snapshot', function (done) {
            var browser = new PhantomBrowser();
            var url = testUrls[0];
            browser
                .openPage(url)
                .then(function () {
                    return browser.takeSnapshot();
                })
                .then(function (result) {
                    assert.include(result, '</html>', 'Snapshot results contain closing </html> tag');
                    browser.done();
                    done();
                }).fail(function (error) {
                    browser.done();
                    done(error);
                });
        });

        it('Can wait for an element to appear and can get the innerHTML of the element', function (done) {
            var browser = new PhantomBrowser();
            var url = testUrls[2];

            const SELECTOR = '#setTimeoutContent';
            browser
                .openPage(url)
                .then(function () {
                    return browser.waitForElement(SELECTOR);
                })
                .then(function () {
                    return browser.getInnerHTML(SELECTOR);
                })
                .then(function (result) {
                    assert.equal(result, 'BUBBLES', 'Awaited element innerHTML should be "BUBBLES"');
                    browser.done();
                    done();
                }).fail(function (error) {
                    browser.done();
                    done(error);
                });
        });

        it('Can fill a form and query a form for its value', function (done) {
            var browser = new PhantomBrowser();
            var url = testUrls[2];

            const USERNAME_SELECTOR = '#form-username';
            const PASSWORD_SELECTOR = '#form-password';

            const USERNAME = 'user123';

            browser
                .openPage(url)
                .then(function () {
                    return browser.fillForm(USERNAME_SELECTOR, USERNAME);
                })
                .then(function () {
                    return browser.getSelectorValue(USERNAME_SELECTOR);
                }).then(function (result) {
                    assert.equal(result, USERNAME, 'Username should be equal to filled value');
                    browser.done();
                    done();
                }).fail(function (error) {
                    done(error);
                });
        });

    });

    describe('Graceful failures', function () {

        describe('Error triggers if a page is not open', function () {

            it('Node style callback', function (done) {
                var browser = new PhantomBrowser();

                browser.takeSnapshot(function (error) {
                    browser.done();
                    assert.ok(error, 'Error should say that a page is not open');
                    done();
                });
            });

            it('Promise', function (done) {
                var browser = new PhantomBrowser();

                browser
                    .takeSnapshot()
                    .then(function (result) {
                        done('Error: Result callback should not be called, it is invalid');
                    }).fail(function (error) {
                        browser.done();
                        assert.ok(error, 'Error should say that a page is not open');
                        done();
                    });
            });
        });

        it('Promise Should propagate errors', function (done) {
            var browser = new PhantomBrowser();

            // provide an invalid url, error should be sent in the callback at .openPage();
            var url = null;

            browser
                .openPage(url)
                .then(function () {
                    return browser.takeSnapshot();
                })
                .then(function (result) {
                    browser.done();
                    done('Error callback should have been triggered, not this.');
                }).fail(function (error) {
                    browser.done();
                    assert.ok(error, 'Error should say that an invalid url is provided');
                    done();
                }).fail(function (error) {
                    // this will be reached if an exception is thrown in the callback for .fail()
                    // as there are issues when throwing synchronous errors in the final callback
                    done(error);
                });
        });
    });

});
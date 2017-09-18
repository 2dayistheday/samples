/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';
//기존의 자바스크립트 코드를 더 엄격한게 검사한다.
//(자세히)strict mode를 사용해야 하는 이유 : http://blog.aliencube.org/ko/2014/01/02/reasons-behind-using-strict-mode-while-coding-javascript/
var express = require('express');
var https = require('https');
var pem = require('pem');
//express - 웹/모바일 앱을 위한 간결하고 유연한 프레임워크 모듈
//express 자세히 : http://expressjs.com/ko/
//https - http 보안 프로토콜
//pem - https 인증서를 잠시간 만들어주는(아래의 createCertificate)
//pem 자세히 : https://www.npmjs.com/package/pem
pem.createCertificate({days: 1, selfSigned: true}, function(err, keys) {
  var options = {
    key: keys.serviceKey,
    cert: keys.certificate
};

var app = express();

app.use(express.static('../'));
//이미지나 css파일, js파일같은 정적 파일을 제공하기 위해 사용한다.
//(../)는 상위의 폴더를 의미 > samples/
//자세히 : http://expressjs.com/ko/starter/static-files.html

// Create an HTTPS service.
https.createServer(options, app).listen(8080);
//위의 인증서(options)와 express모듈 입력, 8080포트로 서버 생성
console.log('serving on https://localhost:8080');
});
//node server.js로 Run
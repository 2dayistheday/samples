/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

var dimensions = document.querySelector('#dimensions');
//p 테그인데, 해당 비디오의 해상도를 표시할 것이다.
var video = document.querySelector('video');
var stream;

var vgaButton = document.querySelector('#vga');
var qvgaButton = document.querySelector('#qvga');
var hdButton = document.querySelector('#hd');
var fullHdButton = document.querySelector('#full-hd');
//각 해상도 버튼
vgaButton.onclick = function() {
  getMedia(vgaConstraints);
};

qvgaButton.onclick = function() {
  getMedia(qvgaConstraints);
};

hdButton.onclick = function() {
  getMedia(hdConstraints);
};

fullHdButton.onclick = function() {
  getMedia(fullHdConstraints);
};
//버튼을 클릭하면 getMedia함수에 해상도 옵션을 넣은 변수를(ex. qvgaContraints)같은 것을 넣는다
var qvgaConstraints = {
  video: {width: {exact: 320}, height: {exact: 240}}
};

var vgaConstraints = {
  video: {width: {exact: 640}, height: {exact: 480}}
};

var hdConstraints = {
  video: {width: {exact: 1280}, height: {exact: 720}}
};

var fullHdConstraints = {
  video: {width: {exact: 1920}, height: {exact: 1080}}
};

function gotStream(mediaStream) {
  window.stream = mediaStream; // stream available to console
  video.srcObject = mediaStream;
}

function displayVideoDimensions() {
  if (!video.videoWidth) {
    setTimeout(displayVideoDimensions, 500);
  }
  dimensions.innerHTML = 'Actual video dimensions: ' + video.videoWidth +
    'x' + video.videoHeight + 'px.';
}

video.onloadedmetadata = displayVideoDimensions;

function getMedia(constraints) {
  if (stream) {
    stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }
//Returns a list of all MediaStreamTrack objects

  navigator.mediaDevices.getUserMedia(constraints)
  .then(gotStream)
  .catch(function(e) {
    var message = 'getUserMedia error: ' + e.name;
    alert(message);
    console.log(message);
  });//카메라 access얻어서 화질대로 보여주기 실행
}

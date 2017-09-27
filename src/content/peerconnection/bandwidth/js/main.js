/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* global TimelineDataSeries, TimelineGraphView */

'use strict';

var remoteVideo = document.querySelector('video#remoteVideo');
var localVideo = document.querySelector('video#localVideo');
var callButton = document.querySelector('button#callButton');
var hangupButton = document.querySelector('button#hangupButton');
var bandwidthSelector = document.querySelector('select#bandwidth');
hangupButton.disabled = true;
callButton.onclick = call;
hangupButton.onclick = hangup;

var pc1;
var pc2;
var localStream;

var bitrateGraph;
var bitrateSeries;

var packetGraph;
var packetSeries;

var lastResult;

var offerOptions = {
  offerToReceiveAudio: 0,
  offerToReceiveVideo: 1
};

function gotStream(stream) {
  hangupButton.disabled = false;
  trace('Received local stream');//5
  localStream = stream;
  localVideo.srcObject = stream;
  localStream.getTracks().forEach(
    function(track) {
      pc1.addTrack(
        track,
        localStream
      );
    }
  );
  trace('Adding Local Stream to peer connection');//6

  pc1.createOffer(
    offerOptions
  ).then(
    gotDescription1,
    onCreateSessionDescriptionError
  );

  bitrateSeries = new TimelineDataSeries();
  bitrateGraph = new TimelineGraphView('bitrateGraph', 'bitrateCanvas');
  bitrateGraph.updateEndDate();

  packetSeries = new TimelineDataSeries();
  packetGraph = new TimelineGraphView('packetGraph', 'packetCanvas');
  packetGraph.updateEndDate();
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function call() {
  callButton.disabled = true;
  bandwidthSelector.disabled = false;
  trace('Starting call');//1
  var servers = null;
  var pcConstraints = {
    'optional': []
  };
  pc1 = new RTCPeerConnection(servers, pcConstraints);
  trace('Created local peer connection object pc1');//2
  pc1.onicecandidate = onIceCandidate.bind(pc1);//8
  //onIceCandidate는 이벤트가 발생햇을 때 호출 할 함수를 호출한다
    //여기서는 bind가 이벤트.?고 pc1이 이벤트 발생 시 파라미터로...
    //그렇다면 setLocalDescription는 bind와 연관이 있는건가??

  pc2 = new RTCPeerConnection(servers, pcConstraints);
  trace('Created remote peer connection object pc2');//3
  pc2.onicecandidate = onIceCandidate.bind(pc2);
  pc2.ontrack = gotRemoteStream;

  trace('Requesting local stream');//4
  navigator.mediaDevices.getUserMedia({
    video: true
  })
  .then(gotStream)//연결되면 스트림시작
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
}

function gotDescription1(desc) {
  trace('Offer from pc1 \n' + desc.sdp);//7 : pc1에서 받아달라 요청하는 단계 + 프로토
  pc1.setLocalDescription(desc).then(//연결된 peer의 끝을 지정
    function() {
      pc2.setRemoteDescription(desc).then(
        function() {
          pc2.createAnswer().then(
            gotDescription2,
            onCreateSessionDescriptionError
          );
        },
        onSetSessionDescriptionError
      );
    },
    onSetSessionDescriptionError
  );
}

function gotDescription2(desc) {
  pc2.setLocalDescription(desc).then(
    function() {//이제 연결된거
      trace('Answer from pc2 \n' + desc.sdp);//10
      pc1.setRemoteDescription({
        type: desc.type,
        sdp: updateBandwidthRestriction(desc.sdp, '500')
      }).then(
        function() {
        },
        onSetSessionDescriptionError
      );
    },
    onSetSessionDescriptionError
  );
}

function hangup() {
  trace('Ending call');//end
  localStream.getTracks().forEach(function(track) {
    track.stop();
  });
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  bandwidthSelector.disabled = true;
}

function gotRemoteStream(e) {
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0];
    trace('Received remote stream');//bind 다음
  }//첫 번째 스트림을 가져 와서 srcobject속성을 설정합니다 . 이렇게하면 해당 비디오 스트림이 요소에 연결되어 사용자에게 표시되기 시작합니다.
}//자세히 : https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ontrack

function getOtherPc(pc) {
  return pc === pc1 ? pc2 : pc1;
}

function getName(pc) {
  return pc === pc1 ? 'pc1' : 'pc2';
}

function onIceCandidate(event) {
  getOtherPc(this)
  .addIceCandidate(event.candidate)
  .then(onAddIceCandidateSuccess)
  .catch(onAddIceCandidateError);

  trace(getName(this) + ' ICE candidate: \n' + (event.candidate ?
      event.candidate.candidate : '(null)'));
}//event = pc1 이나 pc2
//event.candidate.candidate는 pc의 정보 프로토콜.. ip,..etc
//중간에 pc1과 pc2가 event.candidate = false가 되는 이유는.??

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add ICE Candidate: ' + error.toString());
}

function onSetSessionDescriptionError(error) {
  trace('Failed to set session description: ' + error.toString());
}

// renegotiate bandwidth on the fly.
bandwidthSelector.onchange = function() {
  bandwidthSelector.disabled = true;
  var bandwidth = bandwidthSelector.options[bandwidthSelector.selectedIndex]
      .value;
  pc1.createOffer()
  .then(function(offer) {
    return pc1.setLocalDescription(offer);
  })
  .then(function() {
    var desc = {
      type: pc1.remoteDescription.type,
      sdp: bandwidth === 'unlimited'
          ? removeBandwidthRestriction(pc1.remoteDescription.sdp)
          : updateBandwidthRestriction(pc1.remoteDescription.sdp, bandwidth)
    };
    trace('Applying bandwidth restriction to setRemoteDescription:\n' +
        desc.sdp);
    return pc1.setRemoteDescription(desc);
  })
  .then(function() {
    bandwidthSelector.disabled = false;
  })
  .catch(onSetSessionDescriptionError);
};

function updateBandwidthRestriction(sdp, bandwidth) {
  var modifier = 'AS';
  if (adapter.browserDetails.browser === 'firefox') {
    bandwidth = (bandwidth >>> 0) * 1000;
    modifier = 'TIAS';
  }
  if (sdp.indexOf('b=' + modifier + ':') === -1) {
    // insert b= after c= line.
    sdp = sdp.replace(/c=IN (.*)\r\n/,
        'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
  } else {
    sdp = sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'),
        'b=' + modifier + ':' + bandwidth + '\r\n');
  }
  return sdp;
}

function removeBandwidthRestriction(sdp) {
  return sdp.replace(/b=AS:.*\r\n/, '').replace(/b=TIAS:.*\r\n/, '');
}

// query getStats every second
window.setInterval(function() {
  if (!window.pc1) {
    return;
  }
  window.pc1.getStats(null).then(function(res) {
    res.forEach(function(report) {
      var bytes;
      var packets;
      var now = report.timestamp;
      if ((report.type === 'outboundrtp') ||
          (report.type === 'outbound-rtp') ||
          (report.type === 'ssrc' && report.bytesSent)) {
        bytes = report.bytesSent;
        packets = report.packetsSent;
        if (lastResult && lastResult.get(report.id)) {
          // calculate bitrate
          var bitrate = 8 * (bytes - lastResult.get(report.id).bytesSent) /
              (now - lastResult.get(report.id).timestamp);

          // append to chart
          bitrateSeries.addPoint(now, bitrate);
          bitrateGraph.setDataSeries([bitrateSeries]);
          bitrateGraph.updateEndDate();

          // calculate number of packets and append to chart
          packetSeries.addPoint(now, packets -
              lastResult.get(report.id).packetsSent);
          packetGraph.setDataSeries([packetSeries]);
          packetGraph.updateEndDate();
        }
      }
    });
    lastResult = res;
  });
}, 1000);

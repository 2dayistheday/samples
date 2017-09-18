 /* exported trace */

// Logging utility function.
function trace(arg) {
  var now = (window.performance.now() / 1000).toFixed(3);
  console.log(now + ': ', arg);
}
// 자세한 설명 : http://d2.naver.com/helloworld/12864
// fires on window load
(function () {

  // convinence functions
  var $ = document,
      release = $.getElementById('terms'),
      selector = '[type=submit]';
  
  // toggles the send button to be disabled if the 
  // confirmation button is not checked
  release.onchange = function (e) {
    var q = $.querySelector(selector);
    if (e.target.checked) {
      q.removeAttribute("disabled");
    } else {
      q.setAttribute("disabled", "disabled");
    }
  };
})();


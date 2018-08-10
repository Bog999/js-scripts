// ==UserScript==
// @name        WaniKani Real Numbers
// @namespace   Mempo.scripts
// @author      Mempo
// @description Replaces 42+ with the real number using WaniKani API
// @include     http://www.wanikani.com/*
// @include     https://www.wanikani.com/*
// @version     5.3
// @grant       none
// @run-at    document-end
// ==/UserScript==

function main() {
  console.log('START OF WRN');
  var apiKey = localStorage.getItem('apiKey');
  if (!apiKey) {
    if (window.location.href.indexOf('account') != - 1) {
      retrieveAPIkey();
      apiKey = localStorage.getItem('apiKey');
    } else {
      var okcancel = confirm('WaniKani Real Numbers has no API key entered!\nPress OK to go to your settings page and retrieve your API key!');
      if (okcancel == true) {
        window.location = 'https://www.wanikani.com/settings/account';
      }
    }
  }

  var doneReviews = Boolean(localStorage.getItem('WRN_doneReviews') === null || localStorage.getItem('WRN_doneReviews'));
  var lastUpdate = Number(localStorage.getItem('WRN_lastUpdate') || 0);
  var currentTime = new Date().getTime();
  if ((currentTime - lastUpdate) > 120000) {
    localStorage.setItem('WRN_lastUpdate', currentTime.toString());
    doneReviews = true;
  }
  if (window.location.href.indexOf('review') != - 1 || window.location.href.indexOf('lesson') != - 1) {
    localStorage.setItem('WRN_doneReviews', "true");
  } else {
    var numberReviews = document.getElementsByClassName('reviews') [0].getElementsByTagName('span') [0];
    var numberLessons = document.getElementsByClassName('lessons') [0].getElementsByTagName('span') [0];
    if (numberReviews.innerHTML == '42+' || numberLessons.innerHTML == '42+') {
      if (apiKey) {
        if (doneReviews) {
          $.getJSON('https://www.wanikani.com/api/user/' + apiKey + '/study-queue', function (data) {
            setTimeout(function () {
              if (data.error) {
                alert('API Error: ' + data.error.message);
              } else {
                localStorage.setItem('WRN_numberReviews', data.requested_information.reviews_available);
                localStorage.setItem('WRN_numberLessons', data.requested_information.lessons_available);
                localStorage.setItem('WRN_doneReviews', "");
                displayReal(numberReviews, numberLessons);
              }
            }, 0);
          });
        } else {
          displayReal(numberReviews, numberLessons);
        }
      }
    }
  }

}
window.addEventListener('load', main, false);

function retrieveAPIkey() {
  apiKey = document.getElementById('user_api_key').value;

  if (apiKey) {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('WRN_doneReviews', 'true');
    var okcancel = confirm('WaniKani Real Numbers API key set to: ' + apiKey + '\nPress OK to go back to the dashboard!');
      if (okcancel == true) {
        window.location = 'https://www.wanikani.com/dashboard';
      }
  }else{
    alert('Something went wrong! Are you sure you have already generated an API key? If you have, try generating a new one. Hopefully that will solve the problem!');
  }
}

function displayReal(numberReviews, numberLessons) {
  numberReviews.innerHTML = localStorage.getItem('WRN_numberReviews');
  numberLessons.innerHTML = localStorage.getItem('WRN_numberLessons');
}
// ==UserScript==
// @name        WaniKani SRS Reorder Button
// @namespace   towe.wk.srsreorder
// @author      Towe
// @description Adds button enabling item ordering by SRS level.
// @include     *://www.wanikani.com/review/session
// @version     1.1.0
// @grant       none
// ==/UserScript==

/* Settings */

questionTypeOrder = 3; // 1 - reading first, 2 - meaning first, 3 - random
itemTypeOrder = 1;     // 1 - rad->kan->voc, 2 - voc->kan->rad, 3 - random
ascendingSRS = false;   // low-level items first
priotitizeSRS = false;  // SRS order more important than item type order
force1x1 = true;       // meaning and reading directly next to each other

/* Utilities */

function getTypePriority(item) {
  if (item.rad) {
    return 1;
  } else if (item.kan) {
    return 2;
  } else {
    return 3;
  }
}

function itemComparator(itemA, itemB) {
  var srsOrder = ascendingSRS ? itemA.srs - itemB.srs : itemB.srs - itemA.srs;
  var typeOrder = itemTypeOrder === 3 ? 0 : (getTypePriority(itemA) - getTypePriority(itemB)) * (3 - itemTypeOrder * 2);
  return priotitizeSRS ? srsOrder || typeOrder : typeOrder || srsOrder;
}

function showCounters(items) {
  itemsByLevels = [0, 0, 0, 0, 0, 0, 0, 0];
  for (var i = 0; i < items.length; ++i) {
    ++itemsByLevels[items[i].srs - 1];
  }
  var $srsCounters = $('<div id="srsCounters" style="background-color:rgba(255,255,255,0.9);border-radius:8px;color:black;font-weight:bold;margin-top:5px;text-shadow:none"></div>');
  for (var level = 1; level <= itemsByLevels.length; ++level) {
    var color = level < 5 ? 'DD0093' : level < 7 ? '882D9E' : level < 8 ? '294DDB' : '0093DD';
    if (level > 1) {
      $srsCounters.append(', ');
    }
    $srsCounters.append($('<span id="level' + level + '" style="color:#' + color + ';margin:0">' + itemsByLevels[level - 1] + '</span>'));
  }
  $('#srsCounters').remove();
  $('div#stats').append($srsCounters);
}

/* Event handlers */

usedUIDs = [];
previousLevel = 0;

function reorderQuestionTypes() {
  var item = $.jStorage.get('currentItem');
  var newUID = (item.rad ? 'r' : item.kan ? 'k' : 'v') + item.id;
  if (usedUIDs.includes(newUID)) {
    return;
  }
  usedUIDs.push(newUID);
  if (previousLevel > 0) {
    $('#level' + previousLevel).text(--itemsByLevels[previousLevel - 1]);
  }
  previousLevel = item.srs;
  var requestedType = ['reading', 'meaning'][item.rad ? 1 : questionTypeOrder - 1];
  if ($.jStorage.get("questionType") !== requestedType) {
    $.jStorage.set('questionType', requestedType);
    $.jStorage.set('currentItem', item);
  }
}

function reorderBySRS() {
  var items = $.jStorage.get('activeQueue').concat($.jStorage.get('reviewQueue'));
  items.sort(itemComparator);
  showCounters(items);
  $.jStorage.set('activeQueue', items.slice(0, 10));
  $.jStorage.set('reviewQueue', items.slice(10).reverse());
  if (questionTypeOrder !== 3) {
    $.jStorage.listenKeyChange('currentItem', reorderQuestionTypes);
  }
  $.jStorage.set('currentItem', items[0]);
  if (force1x1) {
    try {
        unsafeWindow.Math.random = function() { return 0; };
    } catch (e) {
        Math.random = function() { return 0; };
    }
  }
}

/* Initialization */

$(function() {
  var $button = $('<div style="background-color: #A000f0; color: #FFFFFF; cursor: pointer; display: inline-block; font-size: 0.8125em; padding: 10px; vertical-align: bottom;">Sort by SRS</div>');
  $('footer').prepend($button).on('click', reorderBySRS);
});
// ==UserScript==
// @name        Wanikani Double-Check
// @namespace   wkdoublecheck
// @description Allows retyping typo'd answers, or marking wrong when WK's typo tolerance is too lax.
// @include     https://www.wanikani.com/review/session*
// @version     2.0.12
// @author      Robin Findley
// @copyright   2017+, Robin Findley
// @license     MIT; http://opensource.org/licenses/MIT
// @run-at      document-end
// @grant       none
// ==/UserScript==

// CREDITS: This is a replacement for an original script by Wanikani user @Ethan.
// Ethan's script stopped working due to some Wanikani changes.  The code below is
// 100% my own, but it closely replicates the functionality of Ethan's original script.

// HOTKEYS:
//   "+"      - Marks answer as 'correct'.
//   "-"      - Marks answer as 'incorrect'.
//   "Escape" - Resets question, allowing you to retype.

// SEE SETTINGS BELOW.

window.wkdoublecheck = {};

(function(gobj) {

    //==[ Settings ]=====================================================
    var settings = {

        // Shake when slightly off (i.e. "Close, but no cigar" script)
        shake_when_slightly_off: 0,

        // Delay when answer is wrong.
        delay_wrong: 1,

        // Delay when answer has multiple meanings.
        delay_multi_meaning: 0,

        // Delay when answer is slightly off (e.g. minor typo).
        delay_slightly_off: 0,

        // Amount of time to delay (in milliseconds) before allowing the
        // user to move on after an accepted typo or rejected answer.
        delay_period: 1500,
    };

    // Make the settings accessible from the console via 'wkdoublecheck.settings'
    gobj.settings = settings;

    // For debugging.  Blocks ajax requests.
    settings.block_ajax = 0;

    //===================================================================

    // Theory of operation:
    // ====================
    // Wanikani's normal process:
    //    1) User clicks 'submit'
    //       a) Wanikani checks answer and updates screen with the result.
    //       b) If both reading and meaning have been answered, Wanikani immediately sends the result to the server. (<-- BAD!!)
    //    2) User clicks 'submit' (or enter) again to move to the next question.
    //       a) Wanikani updates the screen to show the next question.
    //
    // Our modified process:
    //    1) User clicks 'submit'
    //       a) We intercept the click, check the answer ourself, and update the screen.
    //          Wanikani's code is unaware of what we're doing.
    //       b) User now has the opportunity to modify their answer.
    //    2) User clicks 'submit' (or enter) again to move to the next question.
    //       a) We intercept the click again.
    //       b) We reset the display back to pre-submitted state, so Wanikani's code won't be confused.
    //       c) We call Wanikani's normal 'submit' function, but we intercept the answer-checker function,
    //          so Wanikani will see whatever result the user requested.
    //          Wanikani's updates the screen with the result.
    //       d) Keep in mind, the user has clicked the 'submit' button twice, but Wanikani has only
    //          seen one click.  So, we have to send a third hidden click so Wanikani will catch up to
    //          where the user thinks we are (i.e. 'next question').
    //    3) We intercept the hidden click, and forward it to Wanikani's code.
    //       a) Wanikani updates the screen to show the next question.

    var old_submit_handler, old_answer_checker, ignore_submit = false, state = 'first_submit', old_audioAutoplay, show_srs, srs_load;
    var item, itype, item_id, item_status, qtype, valid_answers, wrong_cnt, question_cnt, completed_cnt, answer, new_answer;

    //------------------------------------------------------------------------
    // toggle_result() - Toggle an answer from right->wrong or wrong->right.
    //------------------------------------------------------------------------
    function toggle_result(new_state) {
        if ($('#option-double-check').hasClass('disabled')) return false;
        if (new_state === 'toggle') new_state = (new_answer.passed ? 'incorrect' : 'correct');
        if (new_answer.passed && new_state === 'incorrect') {
            new_answer = {passed:false, accurate:false, multipleAnswers:false, exception:false};
            set_answer_state(new_answer, false /* show_msgs */);
        } else if (!new_answer.passed && new_state === 'correct') {
            new_answer = {passed:true, accurate:true, multipleAnswers:false, exception:false};
            set_answer_state(new_answer, false /* show_msgs */);
        } else if (new_state === 'retype') {
            set_answer_state({reset:true}, false /* show_msgs */);
        }
    }

    //------------------------------------------------------------------------
    // do_delay() - Disable the submit button briefly to prevent clicking past wrong answers.
    //------------------------------------------------------------------------
    function do_delay() {
        ignore_submit = true;
        setTimeout(function() {
            ignore_submit = false;
        }, settings.delay_period);
    }

    //------------------------------------------------------------------------
    // return_new_answer() - Alternate answer checker that overrides our results.
    //------------------------------------------------------------------------
    function return_new_answer() {
        return new_answer;
    }

    //------------------------------------------------------------------------
    // set_answer_state() - Update the screen to show results of answer-check.
    //------------------------------------------------------------------------
    function set_answer_state(answer, show_msgs) {
        // If user requested to retype answer, reset the question.
        if (answer.reset) {
            $.jStorage.set('wrongCount', wrong_cnt);
            $.jStorage.set('questionCount', question_cnt);
            $.jStorage.set('completedCount', completed_cnt);
            $.jStorage.set('currentItem', item);
            $("#answer-exception").remove();
            $('#option-double-check').addClass('disabled').find('span').attr('title','Mark Right').find('i').attr('class','icon-thumbs-up');
            $('#option-retype').addClass('disabled');
            Srs.remove();
            state = 'first_submit';
            return;
        }

        // If answer is invalid for some reason, do the shake thing.
        if (answer.exception) {
            if (!$("#answer-form form").is(":animated")) {
                $("#reviews").css("overflow-x", "hidden");
                var xlat = {onyomi:"on'yomi", kunyomi:"kun'yomi", nanori:"nanori"};
                var emph = xlat[item.emph];
                $("#answer-form form").effect("shake", {}, 400, function() {
                    $("#reviews").css("overflow-x", "visible");
                    if (!answer.accurate && settings.shake_when_slightly_off)
                        $("#answer-form form").append($('<div id="answer-exception" class="answer-exception-form"><span>Your answer was a bit off. Check the meaning to make sure you are correct.</span></div>').addClass("animated fadeInUp"));
                    else if (!answer.bad_input)
                        $("#answer-form form").append($('<div id="answer-exception" class="answer-exception-form"><span>WaniKani is looking for the '+emph+" reading</span></div>").addClass("animated fadeInUp"));
                }).find("input").focus();
            }
            return;
        }

        // Draw 'correct' or 'incorrect' results, enable Double-Check button, and calculate updated statistics.
        var new_wrong_cnt = wrong_cnt, new_completed_cnt = completed_cnt;
        $("#user-response").blur();
        $('#option-retype').removeClass('disabled');
        var new_status = Object.assign({},item_status);
        if (answer.passed) {
            $("#answer-form fieldset").removeClass('incorrect').addClass("correct");
            $('#option-double-check').removeClass('disabled').find('span').attr('title','Mark Wrong').find('i').attr('class','icon-thumbs-down');
            if (qtype === 'meaning')
                new_status.mc = (new_status.mc || 0) + 1;
            else
                new_status.rc = (new_status.rc || 0) + 1;
        } else {
            $("#answer-form fieldset").removeClass('correct').addClass("incorrect");
            $('#option-double-check').removeClass('disabled').find('span').attr('title','Mark Right').find('i').attr('class','icon-thumbs-up');
            new_wrong_cnt++;
        }
        if ((itype === 'r' || ((new_status.rc || 0) >= 1)) && ((new_status.mc || 0) >= 1)) {
            new_completed_cnt++;
            if (show_srs) Srs.load(new_status,item.srs);
        }
        $.jStorage.set('wrongCount', new_wrong_cnt);
        $.jStorage.set('questionCount', question_cnt + 1);
        $.jStorage.set('completedCount', new_completed_cnt);
        $("#user-response").prop("disabled", !0);
        additionalContent.enableButtons();
        lastItems.disableSessionStats();
        $("#answer-exception").remove();

        // When user is submitting an answer, display the on-screen message that Wanikani normally shows.
        if (show_msgs) {
            var msg;
            if (answer.passed) {
                if (!answer.accurate) {
                    msg = 'Your answer was a bit off. Check the '+qtype+' to make sure you are correct';
                } else if (answer.multipleAnswers) {
                    msg = 'Did you know this item has multiple possible '+qtype+'s?';
                }
            } else {
                msg = 'Need help? View the correct '+qtype+' and mnemonic';
            }
            //msg += ' lvl ' + item.srs;
            if (msg)
                $("#additional-content").append($('<div id="answer-exception"><span>'+msg+'</span></div>').addClass("animated fadeInUp"));
        }
    }

    //------------------------------------------------------------------------
    // new_submit_handler() - Intercept handler for 'submit' button.  Overrides default behavior as needed.
    //------------------------------------------------------------------------
    function new_submit_handler(e) {
        // Don't process 'submit' if we are ignoring temporarily (to prevent double-tapping past important info)
        if (ignore_submit) {
            // If the user presses <enter> during delay period,
            // WK enables the user input field, which makes Item Info not work.
            // Let's make sure the input field is disabled.
            setTimeout(function(){
                $("#user-response").prop('disabled',!0);
            },1);
            return false;
        }

        // For more information about the state machine below,
        // see the "Theory of operation" info at the top of the script.
        switch(state) {
            case 'first_submit':
                // We intercept the first 'submit' click, and simulate normal Wanikani screen behavior.
                state = 'second_submit';

                // Capture the state of the system before submitting the answer.
                item = $.jStorage.get('currentItem');
                itype = (item.rad ? 'r' : (item.kan ? 'k' : 'v'));
                item_id = itype + item.id;
                item_status = $.jStorage.get(item_id) || {};
                qtype = $.jStorage.get('questionType');
                wrong_cnt = $.jStorage.get('wrongCount');
                question_cnt = $.jStorage.get('questionCount');
                completed_cnt = $.jStorage.get('completedCount');
                show_srs = $.jStorage.get('r/srsIndicator');

                // Ask Wanikani if the answer is right (but we don't actually submit the answer).
                answer = old_answer_checker(qtype, $("#user-response").val());

                // Update the screen to reflect the results of our checked answer.
                $("html, body").animate({scrollTop: 0}, 200);
                new_answer = Object.assign({},answer);

                var text = $('#user-response').val();
                if ((qtype === 'reading' && answerChecker.isNonKanaPresent(text)) ||
                    (qtype === 'meaning' && answerChecker.isKanaPresent(text)) ||
                    (text === '')) {
                    answer.exception = true;
                    answer.bad_input = true;
                }

                // Close but no cigar
                if  (answer.passed && !answer.accurate && settings.shake_when_slightly_off) {
                    answer.exception = true;
                }
                set_answer_state(answer, true /* show_msgs */);
                if (answer.exception) {
                    state = 'first_submit';
                    return false;
                }

                // Optionally (according to settings), temporarily ignore any additional clicks on the
                // 'submit' button to prevent the user from clicking past important info about the answer.
                if ((!answer.passed && settings.delay_wrong) ||
                    (answer.passed &&
                     ((!answer.accurate && settings.delay_slightly_off) || (answer.multipleAnswers && settings.delay_multi_meaning))
                    )
                   )
                {
                    do_delay();
                }

                return false;

            case 'second_submit':
                // We take the user's second 'submit' click (after they've optionally toggled the answer result),
                // and send it to Wanikani's code as if it were the first click.
                // Then we send a hidden third 'submit', which Wanikani will see as the second 'submit', which moves us to the next question.
                state = 'third_submit';

                old_audioAutoplay = window.audioAutoplay;
                window.audioAutoplay = false;

                // Reset the screen to pre-submitted state, so Wanikani won't get confused when it tries to process the answer.
                // Wanikani code will then update the screen according to our forced answer-check result.
                $('#option-double-check').addClass('disabled').find('span').attr('title','Double-Check').find('i').attr('class','icon-thumbs-up');
                $('#option-retype').addClass('disabled');
                $('#user-response').removeAttr('disabled');
                $('#option-audio audio').remove();
                $.jStorage.set('wrongCount', wrong_cnt);
                $.jStorage.set('questionCount', question_cnt);
                $.jStorage.set('completedCount', completed_cnt);

                // Prevent WK from posting a second SRS notice.
                srs_load = Srs.load;
                Srs.load = function(){};

                // Prepare a hidden third click, which tells Wanikani to move to the next question.
                setTimeout(function(){
                    $("#answer-form button").trigger('click');
                }, 1);

                // We want Wanikani to see our forced answer-check result,
                // so we set up to intercept the answer-checker here.
                return old_submit_handler.apply(this, arguments);

            case 'third_submit':
                // This is hidden third click from above, which Wanikani thinks is the second click.
                // Wanikani will move to the next question.
                state = 'first_submit';

                window.audioAutoplay = old_audioAutoplay;

                // We need to disable the input field, so Wanikani will see this as the second click.
                $('#user-response').attr('disabled','disabled');

                // Restore the SRS message function, which we disabled in second_submit above.
                Srs.load = srs_load;

                return old_submit_handler.apply(this, arguments);

            default:
                return false;
        }

        return false;
    }

    //------------------------------------------------------------------------
    // External hook for @polv's script, "WaniKani Disable Default Answers"
    //------------------------------------------------------------------------
    gobj.set_state = function(_state) {
        state = _state;
    };

    //------------------------------------------------------------------------
    // startup() - Install our intercept handlers, and add our Double-Check button and hotkey ("!")
    //------------------------------------------------------------------------
    function startup() {
        // Check if we can intercept the submit button handler.
        try {
            old_submit_handler = $._data( $('#answer-form button')[0], 'events').click[0].handler;
            old_answer_checker = answerChecker.evaluate;
        } catch(err) {}
        if (typeof old_submit_handler !== 'function' || typeof old_answer_checker !== 'function') {
            alert('Wanikani Mistake Delay script is not working.');
            return;
        }

        // Replace the handler.
        $._data( $('#answer-form button')[0], 'events').click[0].handler = new_submit_handler;

        var btn_count = $('#additional-content ul').children().length + 2;
        $('#additional-content ul').css('text-align','center').append(
            '<li id="option-double-check" class="disabled"><span title="Double Check"><i class="icon-thumbs-up"></i></span></li>'+
            '<li id="option-retype" class="disabled"><span title="Retype"><i class="icon-undo"></i></span></li></ul>'
        );
        $('#additional-content ul > li').css('width',Math.floor(9950/btn_count)/100 + '%');
        $('#option-double-check').on('click', toggle_result.bind(null,'toggle'));
        $('#option-retype').on('click', toggle_result.bind(null,'retype'));
        $('body').on('keypress', function(event){
            if (event.which === 43) toggle_result('correct');
            //if (event.which === 45) toggle_result('incorrect');
            return true;
        });
        $('body').on('keydown', function(event){
            if (event.which === 27) toggle_result('retype');
            return true;
        });
        answerChecker.evaluate = return_new_answer;

        // For debugging, block progress submissions.
        if (settings.block_ajax) {
            console.log('======[ "Double-Check" script is in debug mode, and will blocking ajax requests! ]======');
            $.ajax = function(){return $.Deferred().resolve();};
        }
    }

    // Run startup() after window.onload event.
    if (document.readyState === 'complete')
        startup();
    else
        window.addEventListener("load", startup, false);

})(window.wkdoublecheck);

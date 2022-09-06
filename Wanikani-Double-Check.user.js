// ==UserScript==
// @name        Wanikani Double-Check
// @namespace   wkdoublecheck
// @description Allows retyping typo'd answers, or marking wrong when WK's typo tolerance is too lax.
// @include     /^https://(www|preview).wanikani.com/review/session/
// @version     2.2.37
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
//   "Escape" or "Backspace" - Resets question, allowing you to retype.

// SEE SETTINGS BELOW.

window.doublecheck = {};

(function(gobj) {

    /* global $, wkof, additionalContent, lastItems, Srs, wanakana */

    var settings;

    wkof.include('Menu,Settings');
    wkof.ready('document,Menu,Settings').then(setup);

    //------------------------------------------------------------------------
    // setup() - Set up the menu link and default settings.
    //------------------------------------------------------------------------
    function setup() {
        wkof.Menu.insert_script_link({name:'doublecheck',submenu:'Settings',title:'Double-Check',on_click:open_settings});

        var defaults = {
            allow_retyping: true,
            allow_change_correct: false,
            show_corrected_answer: false,
            allow_change_incorrect: false,
            typo_action: 'ignore',
            wrong_answer_type_action: 'warn',
            wrong_number_n_action: 'warn',
            small_kana_action: 'warn',
            kanji_reading_for_vocab_action: 'warn',
            kanji_meaning_for_vocab_action: 'warn',
            delay_wrong: true,
            delay_multi_meaning: false,
            delay_slightly_off: false,
            delay_period: 1.5,
            warn_burn: 'never',
            burn_delay_period: 1.5,
            show_lightning_button: true,
            lightning_enabled: false,
            srs_msg_period: 1.2,
            autoinfo_correct: false,
            autoinfo_incorrect: false,
            autoinfo_multi_meaning: false,
            autoinfo_slightly_off: false
        }
        return wkof.Settings.load('doublecheck', defaults)
            .then(init_ui.bind(null, true /* first_time */));
    }

    //------------------------------------------------------------------------
    // open_settings() - Open the Settings dialog.
    //------------------------------------------------------------------------
    function open_settings() {
        var dialog = new wkof.Settings({
            script_id: 'doublecheck',
            title: 'Double-Check Settings',
            on_save: init_ui,
            pre_open: settings_preopen,
            content: {
                tabAnswers: {type:'page',label:'Answers',content:{
                    grpChangeAnswers: {type:'group',label:'Change Answer',content:{
                        allow_retyping: {type:'checkbox',label:'Allow retyping answer',default:true,hover_tip:'When enabled, you can retype your answer by pressing Escape or Backspace.'},
                        allow_change_incorrect: {type:'checkbox',label:'Allow changing to "incorrect"',default:true,hover_tip:'When enabled, you can change your answer\nto "incorrect" by pressing the "-" key.'},
                        allow_change_correct: {type:'checkbox',label:'Allow changing to "correct"',default:true,hover_tip:'When enabled, you can change your answer\nto "correct" by pressing the "+" key.'},
                        show_corrected_answer: {type:'checkbox',label:'Show corrected answer',default:false,hover_tip:'When enabled, pressing \'+\' to correct your answer puts the\ncorrected answer in the input field. Pressing \'+\' multiple\ntimes cycles through all acceptable answers.'},
                    }},
                    grpCarelessMistakes: {type:'group',label:'Careless Mistakes',content:{
                        typo_action: {type:'dropdown',label:'Typos in meaning',default:'ignore',content:{ignore:'Ignore',warn:'Warn/shake',wrong:'Mark wrong'},hover_tip:'Choose an action to take when meaning contains typos.'},
                        wrong_answer_type_action: {type:'dropdown',label:'Wrong answer type',default:'warn',content:{warn:'Warn/shake',wrong:'Mark wrong'},hover_tip:'Choose an action to take when reading was entered instead of meaning, or vice versa.'},
                        wrong_number_n_action: {type:'dropdown',label:'Wrong number of n\'s',default:'warn',content:{warn:'Warn/shake',wrong:'Mark wrong'},hover_tip:'Choose an action to take when you type the wrong number of n\'s in certain reading questions.'},
                        small_kana_action: {type:'dropdown',label:'Big kana instead of small',default:'warn',content:{warn:'Warn/shake',wrong:'Mark wrong'},hover_tip:'Choose an action to take when you type a big kana instead of small (e.g. ゆ instead of ゅ).'},
                        kanji_reading_for_vocab_action: {type:'dropdown',label:'Kanji reading instead of vocab',default:'warn',content:{warn:'Warn/shake',wrong:'Mark wrong'},hover_tip:'Choose an action to take when the reading of a kanji is entered for a single character vocab word instead of the correct vocab reading.'},
                        kanji_meaning_for_vocab_action: {type:'dropdown',label:'Kanji meaning instead of vocab',default:'warn',content:{warn:'Warn/shake',wrong:'Mark wrong'},hover_tip:'Choose an action to take when the meaning of a kanji is entered for a single character vocab word instead of the correct vocab meaning.'},
                    }},
                }},
                tabMistakeDelay: {type:'page',label:'Mistake Delay',content:{
                    grpDelay: {type:'group',label:'Delay Next Question',content:{
                        delay_wrong: {type:'checkbox',label:'Delay when wrong',default:true,refresh_on_change:true,hover_tip:'If your answer is wrong, you cannot advance\nto the next question for at least N seconds.'},
                        delay_multi_meaning: {type:'checkbox',label:'Delay when multiple meanings',default:false,hover_tip:'If the item has multiple meanings, you cannot advance\nto the next question for at least N seconds.'},
                        delay_slightly_off: {type:'checkbox',label:'Delay when answer has typos',default:false,hover_tip:'If your answer contains typos, you cannot advance\nto the next question for at least N seconds.'},
                        delay_period: {type:'number',label:'Delay period (in seconds)',default:1.5,hover_tip:'Number of seconds to delay before allowing\nyou to advance to the next question.'},
                    }},
                }},
                tabBurnReviews: {type:'page',label:'Burn Reviews',content:{
                    grpBurnReviews: {type:'group',label:'Burn Reviews',content:{
                        warn_burn: {type:'dropdown',label:'Warn before burning',default:'never',content:{never:'Never',cheated:'If you changed answer',always:'Always'},hover_tip:'Choose when to warn before burning an item.'},
                        burn_delay_period: {type:'number',label:'Delay after warning (in seconds)',default:1.5,hover_tip:'Number of seconds to delay before allowing\nyou to advance to the next question after seeing a burn warning.'},
                    }},
                }},
                tabLightning: {type:'page',label:'Lightning',content:{
                    grpLightning: {type:'group',label:'Lightning Mode',content:{
                        show_lightning_button: {type:'checkbox',label:'Show "Lightning Mode" button',default:true,hover_tip:'Show the "Lightning Mode" toggle\nbutton on the review screen.'},
                        lightning_enabled: {type:'checkbox',label:'Enable "Lightning Mode"',default:true,refresh_on_change:true,hover_tip:'Enable "Lightning Mode", which automatically advances to\nthe next question if you answer correctly.'},
                        srs_msg_period: {type:'number',label:'SRS popup time (in seconds)',default:1.2,min:0,hover_tip:'How long to show SRS up/down popup when in lightning mode.  (0 = don\'t show)'},
                    }},
                }},
                tabAutoInfo: {type:'page',label:'Item Info',content:{
                    grpAutoInfo: {type:'group',label:'Show Item Info',content:{
                        autoinfo_correct: {type:'checkbox',label:'After correct answer',default:false,hover_tip:'Automatically show the Item Info after correct answers.', validate:validate_autoinfo_correct},
                        autoinfo_incorrect: {type:'checkbox',label:'After incorrect answer',default:false,hover_tip:'Automatically show the Item Info after incorrect answers.', validate:validate_autoinfo_incorrect},
                        autoinfo_multi_meaning: {type:'checkbox',label:'When multiple meanings',default:false,hover_tip:'Automatically show the Item Info when an item has multiple meanings.', validate:validate_autoinfo_correct},
                        autoinfo_slightly_off: {type:'checkbox',label:'When answer has typos',default:false,hover_tip:'Automatically show the Item Info when your answer has typos.', validate:validate_autoinfo_correct},
                    }},
                }},
            }
        });
        dialog.open();
    }

    //------------------------------------------------------------------------
    // validate_autoinfo_correct() - Notify user if iteminfo and lightning are both enabled.
    //------------------------------------------------------------------------
    function validate_autoinfo_correct(enabled) {
        if (enabled && settings.lightning_enabled) {
            return 'Disable "Lightning Mode"!';
        }
    }

    //------------------------------------------------------------------------
    // validate_autoinfo_incorrect() - Notify user if iteminfo and lightning are both enabled, and wrong_delay disabled.
    //------------------------------------------------------------------------
    function validate_autoinfo_incorrect(enabled) {
        if (enabled && settings.lightning_enabled && !settings.delay_wrong) {
            return 'Disable "Lightning Mode", or<br>enable "Delay when wrong"!';
        }
    }

    //------------------------------------------------------------------------
    // settings_preopen() - Notify user if iteminfo and lightning are both enabled.
    //------------------------------------------------------------------------
    function settings_preopen(dialog) {
        dialog.dialog({width:525});
    }

    //------------------------------------------------------------------------
    // init_ui() - Initialize the user interface.
    //------------------------------------------------------------------------
    var first_time = true;
    function init_ui() {
        settings = wkof.settings.doublecheck;

        if (first_time) {
            first_time = false;
            startup();
        }

        // Migrate 'lightning' setting from localStorage.
        var lightning = localStorage.getItem('lightning');
        if (lightning === 'false' || lightning === 'true') {
            localStorage.removeItem('lightning');
            settings.lightning_enabled = lightning;
            wkof.Settings.save('doublecheck');
        }

        // Initialize the Lightning Mode button.
        if (settings.lightning_enabled) {
            $('#lightning-mode').addClass('doublecheck-active');
        } else {
            $('#lightning-mode').removeClass('doublecheck-active');
        }
        $('#lightning-mode').prop('hidden', !settings.show_lightning_button);

        setClass('#option-double-check', 'hidden', !(settings.allow_change_correct || settings.allow_change_incorrect));
        setClass('#option-retype', 'hidden', !settings.allow_retyping);
        resize_buttons();

        if (state === 'second_submit') {
            setClass('#option-double-check', 'disabled', !(
                (new_answer.passed && (settings.allow_change_incorrect || !first_answer.passed)) ||
                (!new_answer.passed && (settings.allow_change_correct || first_answer.passed))
            ));
            setClass('#option-retype', 'disabled', !settings.allow_retyping);
        } else {
            setClass('#option-double-check', 'disabled', true);
        }
    }

    var old_submit_handler, old_answer_checker, ignore_submit = false, state = 'first_submit', show_srs, srs_load, delay_timer;
    var item, itype, item_id, item_status, qtype, valid_answers, wrong_cnt, question_cnt, completed_cnt, answer, new_answer, active_queue;
    var last_item_id, last_qtype, first_answer;

    //------------------------------------------------------------------------
    // lightning_clicked() - Lightning button handler.
    //------------------------------------------------------------------------
    function lightning_clicked() {
        settings.lightning_enabled = !settings.lightning_enabled;
        wkof.Settings.save('doublecheck');
        $('#lightning-mode').toggleClass('doublecheck-active', settings.lightning_enabled);
        return false;
    }

    //------------------------------------------------------------------------
    // get_correct_answers() - Returns an array of acceptable answers.
    //------------------------------------------------------------------------
    function get_correct_answers() {
        if (qtype === 'reading') {
            if (itype === 'k') {
                switch (item.emph) {
                    case "onyomi": return item.on;
                    case "kunyomi": return item.kun;
                    case "nanori": return item.nanori;
                }
            } else {
                return item.kana;
            }
        } else {
            return [].concat(item.syn,item.en);
        }
    }

    //------------------------------------------------------------------------
    // get_next_correct_answer() - Returns the next acceptable answer from the
    //    array returned by get_correct_answers().
    //------------------------------------------------------------------------
    function get_next_correct_answer() {
        var result = first_answer.correct_answers[first_answer.correct_answer_index];
        first_answer.correct_answer_index = (first_answer.correct_answer_index + 1) % first_answer.correct_answers.length;
        return result;
    }

    //------------------------------------------------------------------------
    // toggle_result() - Toggle an answer from right->wrong or wrong->right.
    //------------------------------------------------------------------------
    function toggle_result(new_state) {
        if (new_state === 'toggle') new_state = (new_answer.passed ? 'incorrect' : 'correct');
        if (state !== 'second_submit') return false;

        var input = $('#answer-form fieldset input');
        var current_response = input.val();
        clear_delay();
        switch (new_state) {
            case 'correct':
                if (!(settings.allow_change_correct || first_answer.passed)) return false;
                if (first_answer.passed) {
                    input.val(first_answer.response);
                } else {
                    input.val(get_next_correct_answer());
                }
                new_answer = {passed:true, accurate:true, multipleAnswers:false, exception:false};
                set_answer_state(new_answer, false /* show_msgs */);
                if (!settings.show_corrected_answer) input.val(current_response);
                break;
            case 'incorrect':
                if (!(new_answer.passed && (settings.allow_change_incorrect || !first_answer.passed))) return false;
                if (first_answer.passed) {
                    input.val('xxxxxx');
                } else {
                    input.val(first_answer.response);
                }
                new_answer = {passed:false, accurate:false, multipleAnswers:false, exception:false};
                set_answer_state(new_answer, false /* show_msgs */);
                if (!settings.show_corrected_answer) input.val(current_response);
                break;
            case 'retype':
                if (!settings.allow_retyping) return false;
                set_answer_state({reset:true, due_to_retype:true});
                break;
        }
    }

    //------------------------------------------------------------------------
    // do_delay() - Disable the submit button briefly to prevent clicking past wrong answers.
    //------------------------------------------------------------------------
    function do_delay(period) {
        if (period === undefined) period = settings.delay_period;
        ignore_submit = true;
        delay_timer = setTimeout(function() {
            delay_timer = -1;
            ignore_submit = false;
        }, period*1000);
    }

    //------------------------------------------------------------------------
    // clear_delay() - Clear the delay timer.
    //------------------------------------------------------------------------
    function clear_delay() {
        if (delay_timer) {
            ignore_submit = false;
            clearTimeout(delay_timer);
            delay_timer = undefined;
        }
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
            clear_delay();
            if (state === 'second_submit') {
                $.jStorage.set('wrongCount', wrong_cnt);
                $.jStorage.set('questionCount', question_cnt);
                $.jStorage.set('completedCount', completed_cnt);
                $.jStorage.set('activeQueue', active_queue);
            }
            state = 'first_submit';

            // If we are resetting due to the user clicking 'retype', then we need to trigger
            // a refresh the input field and stats by updating 'currentItem' in jStorage.
            if (answer.due_to_retype) {
                $.jStorage.set('currentItem', $.jStorage.get('currentItem'));
                return
            }

            window.wkRefreshAudio();
            $("#answer-exception").remove();
            $('#option-double-check').addClass('disabled').find('span').attr('title','Mark Right').find('i').attr('class','fa fa-thumbs-up');
            $('#option-retype').addClass('disabled');
            Srs.remove();
            return;
        }

        // If answer is invalid for some reason, do the shake thing.
        var dblchk = $('#option-double-check');
        var input = $('#user-response');
        if (answer.exception) {
            $("#answer-exception").remove();
            if (answer.confirming_burn) {
                // NOTE: We can only reach this branch if the current answer is correct, otherwise we wouldn't be burning it.
                dblchk.find('span').attr('title','Mark Wrong').find('i').attr('class','fa fa-thumbs-down');
                setClass(dblchk, 'disabled', !(settings.allow_change_incorrect || !first_answer.passed));
                $("#answer-form fieldset").removeClass('incorrect').removeClass('correct').addClass('confburn');
                $("#additional-content").append($('<div id="answer-exception"><span>'+answer.exception+'</span></div>').addClass("animated fadeInUp"));
                return;
            }
            if (!$("#answer-form form").is(":animated")) {
                $("#reviews").css("overflow-x", "hidden");
                $("#answer-form form").effect("shake", {}, 300, function() {
                    $("#reviews").css("overflow-x", "visible");
                    if (!answer.accurate && input.val() !== '') {
                        if (typeof answer.exception === "string") {
                            $("#answer-form form").append($('<div id="answer-exception" class="answer-exception-form"><span>' + answer.exception + '</span></div>').addClass("animated fadeInUp"));
                        }
                    }
                }).find("input").focus();
            }
            return;
        }

        // Draw 'correct' or 'incorrect' results, enable Double-Check button, and calculate updated statistics.
        $("#user-response").blur();
        var new_status = Object.assign({},item_status);
        var retype = $('#option-retype');
        setClass(retype, 'disabled', !settings.allow_retyping);
        if (answer.passed) {
            $("#answer-form fieldset").removeClass('incorrect').removeClass('confburn').addClass('correct');
            dblchk.find('span').attr('title','Mark Wrong').find('i').attr('class','fa fa-thumbs-down');
            setClass(dblchk, 'disabled', !(settings.allow_change_incorrect || !first_answer.passed));
            if (qtype === 'meaning') {
                new_status.mc = (new_status.mc || 0) + 1;
            } else {
                new_status.rc = (new_status.rc || 0) + 1;
                if (input.val().slice(-1) === 'n') input.val(input.val().slice(0,-1)+'ん');
            }
        } else {
            $("#answer-form fieldset").removeClass('correct').removeClass('confburn').addClass('incorrect');
            dblchk.find('span').attr('title','Mark Right').find('i').attr('class','fa fa-thumbs-up');
            setClass(dblchk, 'disabled', !(settings.allow_change_correct || first_answer.passed));
            $.jStorage.set('wrongCount', wrong_cnt + 1);
        }
        $.jStorage.set('questionCount', question_cnt + 1);

        if (((itype === 'r') || ((new_status.rc || 0) >= 1)) && ((new_status.mc || 0) >= 1)) {
            if (show_srs) {
                if (settings.lightning_enabled) {
                    if (settings.srs_msg_period > 0) {
                        var status = Object.assign({},new_status);
                        var srs = item.srs;
                        setTimeout(Srs.load.bind(Srs, status, srs), 100);
                        setTimeout(Srs.remove, settings.srs_msg_period * 1000);
                    }
                } else {
                    Srs.remove();
                    Srs.load(new_status,item.srs);
                }
            }
            $.jStorage.set('completedCount', completed_cnt + 1);
            $.jStorage.set('activeQueue', active_queue.slice(1));
        }

        $("#user-response").prop("disabled", true);

        window.wkRefreshAudio();
        additionalContent.enableButtons();
        lastItems.disableSessionStats();
        $("#answer-exception").remove();

        // Open item info, depending on settings.
        var showing_info = false;
        if (answer.passed && !settings.lightning_enabled &&
            (settings.autoinfo_correct ||
             (settings.autoinfo_slightly_off && !answer.accurate) ||
             (settings.autoinfo_multi_meaning && answer.multipleAnswers)
            )) {
            showing_info = true;
            $('#option-item-info').click();
        } else if (!answer.passed && !(settings.lightning_enabled && !settings.delay_wrong) && settings.autoinfo_incorrect) {
            showing_info = true;
            $('#option-item-info').click();
        }

        // When user is submitting an answer, display the on-screen message that Wanikani normally shows.
        if (show_msgs) {
            var msg;
            if (answer.passed) {
                if (!answer.accurate) {
                    msg = 'Your answer was a bit off. Check the '+qtype+' to make sure you are correct';
                } else if (answer.multipleAnswers) {
                    msg = 'Did you know this item has multiple possible '+qtype+'s?';
                }
            } else if (answer.custom_msg) {
                msg = answer.custom_msg;
            } else {
                msg = 'Need help? View the correct '+qtype+' and mnemonic';
            }
            if (msg) {
                if (showing_info) {
                    $("#information").prepend($('<div id="answer-exception" style="top:0;"><span>'+msg+'</span></div>').addClass("animated fadeInUp"));
                } else {
                    $("#additional-content").append($('<div id="answer-exception"><span>'+msg+'</span></div>').addClass("animated fadeInUp"));
                }
            }
        }
    }

    //------------------------------------------------------------------------
    // setClass() - Add or remove a class based on the 'enabled' state.
    //------------------------------------------------------------------------
    function setClass(elem, classname, enabled) {
        if (typeof elem === 'string') elem = $(elem);
        if (enabled) {
            elem.addClass(classname)
        } else {
            elem.removeClass(classname);
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
                $("#user-response").prop('disabled',true);
            },1);
            return false;
        }

        var submitted_immediately = false;
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
                wrong_cnt = $.jStorage.get('wrongCount') || 0;
                question_cnt = $.jStorage.get('questionCount') || 0;
                completed_cnt = $.jStorage.get('completedCount') || 0;
                active_queue = $.jStorage.get('activeQueue') || [];
                show_srs = $.jStorage.get('r/srsIndicator');

                // Ask Wanikani if the answer is right (but we don't actually submit the answer).
                answer = old_answer_checker(qtype, $("#user-response").val());

                // Update the screen to reflect the results of our checked answer.
                $("html, body").animate({scrollTop: 0}, 200);

                // Check if [meaning has kana] or [reading has latin]
                var text = $('#user-response').val();
                if ((qtype === 'reading' && window.answerChecker.isNonKanaPresent(text)) ||
                    (qtype === 'meaning' && window.answerChecker.isKanaPresent(text)) ||
                    (text === '')) {
                    answer.exception = answer.exception || true;
                }

                // Non-exact answer (i.e. "Close but no cigar" script)
                if (answer.passed && !answer.accurate) {
                    switch (settings.typo_action) {
                        case 'warn': answer.exception = 'Your answer was close, but not exact'; break;
                        case 'wrong': answer.passed = false; answer.custom_msg = 'Your answer was not exact, as required by your settings.'; break;
                    }
                }

                // Check for reading/meaning mixups
                if (!answer.passed) {
                    if (qtype === 'meaning') {
                        var accepted_readings = [].concat(item.kana, item.on, item.kun, item.nanori);
                        var answer_as_kana = to_kana($('#user-response').val());
                        if (accepted_readings.indexOf(answer_as_kana) >= 0) {
                            if (settings.wrong_answer_type_action === 'warn') {
                                answer.exception = 'Oops, we want the meaning, not the reading.';
                            } else {
                                answer.exception = false;
                            }
                        }
                    } else {
                        // Although Wanikani now checks for readings entered as meanings, it only
                        // checks the 'preferred' reading.  Here, we check all readings.
                        var accepted_meanings = item.en;
                        try {
                            accepted_meanings = accepted_meanings.concat(item.syn, item.auxiliary_meanings
                                                                         .filter((meaning) => meaning.type === 'whitelist')
                                                                         .map((meaning) => meaning.meaning));
                        } catch(e) {}
                        var meanings_as_hiragana = accepted_meanings.map(m => to_kana(m.toLowerCase()).replace(/\s/g,''));
                        var answer_as_hiragana = Array.from($('#user-response').val().toLowerCase()).map(c => wanakana.toHiragana(c)).join('');
                        if (meanings_as_hiragana.indexOf(answer_as_hiragana) >= 0) {
                            if (settings.wrong_answer_type_action === 'warn') {
                                answer.exception = 'Oops, we want the reading, not the meaning.';
                            } else {
                                answer.exception = false;
                            }
                        }
                    }
                }

                // Check for Wanikani warnings that should be changed to 'wrong', based on settings.
                if (typeof answer.exception === 'string') {
                    if (((settings.kanji_meaning_for_vocab_action === 'wrong') && answer.exception.toLowerCase().includes('want the vocabulary meaning, not the kanji meaning')) ||
                        ((settings.kanji_reading_for_vocab_action === 'wrong') && answer.exception.toLowerCase().includes('want the vocabulary reading, not the kanji reading')) ||
                        ((settings.wrong_number_n_action === 'wrong') && answer.exception.toLowerCase().includes('forget that ん')) ||
                        ((settings.small_kana_action === 'wrong') && answer.exception.toLowerCase().includes('watch out for the small')))
                    {
                        answer.exception = false;
                        answer.passed = false;
                    }
                }

                // Copy the modified answer to new_answer, which is what will be submitted to Wanikani.
                new_answer = Object.assign({}, answer);

                // Check for exceptions that are preventing the answer from being submitted.
                if (answer.exception) {
                    set_answer_state(answer, true /* show_msgs */);
                    state = 'first_submit';
                    return false;
                }

                // At this point, the answer is ready for submission (i.e. no exceptions).
                // If this is the user's first attempt at this question, remember the result so
                // we can determine whether they altered their answer later.
                if (!((item_id === last_item_id) && (qtype === last_qtype))) {
                    first_answer = Object.assign({
                        response:$("#user-response").val(),
                        correct_answers:get_correct_answers(),
                        correct_answer_index: 0,
                    }, answer);
                }
                last_item_id = item_id;
                last_qtype = qtype;

                // Optionally (according to settings), temporarily ignore any additional clicks on the
                // 'submit' button to prevent the user from clicking past important info about the answer.
                if ((!answer.passed && settings.delay_wrong) ||
                    (answer.passed &&
                     ((!answer.accurate && settings.delay_slightly_off) ||
                      (answer.multipleAnswers && settings.delay_multi_meaning))
                    )
                   )
                {
                    set_answer_state(answer, true /* show_msgs */);
                    do_delay();
                    return false;
                }

                set_answer_state(answer, true /* show_msgs */);
                if (settings.lightning_enabled) {
                    new_submit_handler(e);
                }

                return false;

            case 'second_submit':

                // If the user changed their answer to 'correct', mark the item
                // in storage, so we can warn the user if it comes up for burn.
                // The mark is kept for 10 days in case the user doesn't complete
                // the item (reading and meaning) within one session.
                if (!first_answer.passed && new_answer.passed) {
                    $.jStorage.set('confburn/' + item.id, true, {TTL:1000*3600*24*10});
                }

                // Before accepting a final submit, notify the user if item will burn (depending on settings).
                new_answer.exception = false;
                if (!new_answer.confirming_burn) {
                    // Check if we need to warn the user that this is a 'burn' review.
                    // NOTE: "item_status.ni" seems to be used by other scripts.
                    var will_burn = (item.srs === 8) && new_answer.passed &&
                        !(item_status.mi || item_status.ri || item_status.ni) &&
                        ((itype === 'r') ||
                         (((item_status.rc || 0) + (qtype === 'reading' ? 1 : 0) > 0) &&
                          ((item_status.mc || 0) + (qtype === 'meaning' ? 1 : 0) > 0)));
                    var cheated = $.jStorage.get('confburn/' + item.id) ? true : false;
                    if (will_burn && (settings.warn_burn !== 'never')) {
                        // Prompt before burning, and suppress proceeding for a moment.
                        if (cheated) {
                            new_answer.exception = 'You modified an answer on this item. It will be burned if you continue.';
                        } else if (settings.warn_burn === 'always') {
                            new_answer.exception = 'This item will be burned if you continue.'
                        }
                        if (new_answer.exception) {
                            new_answer.confirming_burn = true;
                            set_answer_state(new_answer, true /* show_msgs */);
                            // Not sure what's causing the input field to be re-enabled, but we have to disable it:
                            setTimeout(function () {
                                $("#user-response").prop('disabled',true);
                            }, 1);
                            if (settings.burn_delay_period > 0) {
                                do_delay(settings.burn_delay_period);
                            }
                            return false;
                        }
                    }
                } else {
                    // We are burning the item now, so we can remove the marker.
                    $.jStorage.deleteKey('confburn/' + item.id);
                    delete new_answer.confirming_burn;
                }

                // We intercepted the first submit, allowing the user to optionally modify their answer.
                // Now, either the user has clicked submit again, or lightning is enabled and we are automatically clicking submit again.
                // Since Wanikani didn't see the first submit (because we intercepted it), now we need to simulate two submits for Wanikani:
                //   1. One for Wanikani to check the (possibly corrected) result, and
                //   2. One for Wanikani to move on to the next question.

                // Reset the screen to pre-submitted state, so Wanikani won't get confused when it tries to process the answer.
                // Wanikani code will then update the screen according to our forced answer-check result.
                $('#option-double-check').addClass('disabled').find('span').attr('title','Double-Check').find('i').attr('class','fa fa-thumbs-up');
                $('#option-retype').addClass('disabled');
                $('#user-response').prop('disabled', false);
                $.jStorage.set('wrongCount', wrong_cnt);
                $.jStorage.set('questionCount', question_cnt);
                $.jStorage.set('completedCount', completed_cnt);
                $.jStorage.set('activeQueue', active_queue);

                // Prevent WK from posting a second SRS notice.
                srs_load = Srs.load;
                Srs.load = function(){};

                // This is the first submit actually forwarded to Wanikani.
                // It will check our (possibly corrected) answer.
                var old_audioAutoplay = window.audioAutoplay;
                window.audioAutoplay = false;
                old_submit_handler.apply(this, arguments);

                // This is hidden third click from above, which Wanikani thinks is the second click.
                // Wanikani will move to the next question.
                state = 'first_submit';

                // We need to disable the input field, so Wanikani will see this as the second click.
                $('#user-response').prop('disabled', true);

                // Restore the SRS message function, which we disabled in second_submit above.
                Srs.load = srs_load;

                // This is the second submit actually forwarded to Wanikani.
                // It will move on to the next question.
                var result = old_submit_handler.apply(this, arguments);
                window.audioAutoplay = old_audioAutoplay;
                window.wkRefreshAudio();
                return result;

            default:
                return false;
        }

        return false;
    }

    //------------------------------------------------------------------------
    // Simulate input character by character and convert with WanaKana to kana
    //  -- Contributed by user @Sinyaven
    //------------------------------------------------------------------------
    function to_kana(text) {
        return Array.from(text).reduce((total, c) => wanakana.toKana(total + c, {IMEMode: true}), "").replace(/n$/, String.fromCharCode(12435));
    }

    //------------------------------------------------------------------------
    // Resize the buttons according to how many are visible.
    //------------------------------------------------------------------------
    function resize_buttons() {
        var buttons = $('#additional-content ul>li');
        var btn_count = buttons.length - buttons.filter('.hidden,[hidden]').length;
        $('#additional-content ul > li').css('width',Math.floor(9900/btn_count)/100 + '%');
    }

    //------------------------------------------------------------------------
    // External hook for @polv's script, "WaniKani Disable Default Answers"
    //------------------------------------------------------------------------
    gobj.set_state = function(_state) {
        state = _state;
    };

    //------------------------------------------------------------------------
    // startup() - Install our intercept handlers, and add our Double-Check button and hotkey
    //------------------------------------------------------------------------
    function startup() {
        // Intercept the submit button handler.
        try {
            var intercepted = false;
            try {
                old_submit_handler = $._data( $('#answer-form form')[0], 'events').submit[0].handler;
                $._data( $('#answer-form form')[0], 'events').submit[0].handler = new_submit_handler;
                intercepted = true;
            } catch(err) {}
            if (!intercepted) {
                try {
                    old_submit_handler = $._data( $('#answer-form button')[0], 'events').click[0].handler;
                    $._data( $('#answer-form button')[0], 'events').click[0].handler = new_submit_handler;
                    intercepted = true;
                } catch(err) {}
            }
            if (intercepted) {
                old_answer_checker = window.enhanceAnswerChecker({evaluate:window.answerChecker.evaluate}).evaluate;
            }
        } catch(err) {}
        if (typeof old_submit_handler !== 'function' || typeof old_answer_checker !== 'function') {
            alert('Wanikani Double-Check script is not working.');
            return;
        }

        // Clear warning popups if question changes due to reasons outside of this script
        $.jStorage.listenKeyChange("currentItem", function(key, action){
            set_answer_state({reset:true});
        });

        // Install the Lightning Mode button.
        $('head').append('<style>#lightning-mode.doublecheck-active {color:#ff0; opacity:1.0;}</style>');
        $('#summary-button').append('<a id="lightning-mode" href="#" hidden ><i class="fa fa-bolt" title="Lightning Mode - When enabled, auto-\nadvance after answering correctly."></i></a>');
        $('#lightning-mode').on('click', lightning_clicked);

        // Install the Double-Check features.
        $('#additional-content ul').css('text-align','center').append(
            '<li id="option-double-check" class="disabled"><span title="Double Check"><i class="fa fa-thumbs-up"></i></span></li>'+
            '<li id="option-retype" class="disabled"><span title="Retype"><i class="fa fa-undo"></i></span></li></ul>'
        );
        $('#option-double-check').on('click', toggle_result.bind(null,'toggle'));
        $('#option-retype').on('click', toggle_result.bind(null,'retype'));
        $('body').on('keypress', function(event){
            if (event.which === 43) toggle_result('correct');
            if (event.which === 45) toggle_result('incorrect');
            return true;
        });
        $('body').on('keydown', function(event){
            if ((event.which === 27 || event.which === 8) &&
                (state !== 'first_submit') &&
                (event.target.nodeName === 'BODY') &&
                (!document.querySelector('#wkofs_doublecheck')))
            {
                toggle_result('retype');
                return false;
            } else if (event.ctrlKey && event.key === 'l') {
                lightning_clicked();
                return false;
            }
            return true;
        });
        $('head').append(
            '<style>'+
            '#additional-content>ul>li.hidden {display:none;}'+
            '#answer-form fieldset.confburn button, #answer-form fieldset.confburn input[type=text], #answer-form fieldset.confburn input[type=text]:disabled {'+
            '  background-color: #000 !important;'+
            '  color: #fff;'+
            '  text-shadow: 2px 2px 0 rgba(0,0,0,0.2);'+
            '  transition: background-color 0.1s ease-in;'+
            '  opacity: 1 !important;'+
            '}'+
            '</style>');

        // Override the answer checker.
        window.answerChecker.evaluate = return_new_answer;
        window.enhanceAnswerChecker = function(answerChecker) {return answerChecker;};

        // To prevent Wanikani from cutting the audio off in lightning mode,
        // We instruct any currently playing audio to unload when it's done,
        // rather than unloading it immediately.
        window.Howler.unload = function(){
            for (var i = window.Howler._howls.length-1; i >= 0; i--) {
                var howl = window.Howler._howls[i];
                if (howl.playing() || howl._queue.length > 0) {
                    howl.on('end', howl.unload.bind(howl));
                } else {
                    howl.unload();
                }
            }
        };
    }

})(window.doublecheck);

// ==UserScript==
// @name        Duolingo Pro
// @namespace   Violentmonkey Scripts
// @match       https://*.duolingo.com/*
// @grant       GM_log
// @version     1.2
// @author      anonymoushackerIV
// @description Duolingo Auto Solver Tool - WORKING AUGUST 2023
// @license MIT
// ==/UserScript==

let solvingIntervalId;
let isAutoMode = false;

function addSolvingButtons() {
    if (window.location.pathname === '/learn') {
        let button = document.querySelector('a[data-test="global-practice"]');
        if (button) {
            return;
        }
    }

    const solveAllButton = document.getElementById("solveAllButton");
    if (solveAllButton !== null) {
        return;
    }

    const original = document.querySelectorAll('[data-test="player-next"]')[0];
    if (original === undefined) {
        const startButton = document.querySelector('[data-test="start-button"]');
        console.log(`Wrapper line: ${startButton}`);
        if (startButton === null) {
            return;
        }
        const wrapper = startButton.parentNode;
        const solveAllButton = document.createElement('a');
        solveAllButton.className = startButton.className;
        solveAllButton.id = "solveAllButton";
        solveAllButton.innerText = "COMPLETE SKILL";
        solveAllButton.removeAttribute('href');
        solveAllButton.addEventListener('click', () => {
            solving();
            setInterval(() => {
                const startButton = document.querySelector('[data-test="start-button"]');
                if (startButton && startButton.innerText.startsWith("START")) {
                    startButton.click();
                }
            }, 1000);
            startButton.click();
        });
        wrapper.appendChild(solveAllButton);
    } else {
        const wrapper = document.getElementsByClassName('_10vOG')[0];
        wrapper.style.display = "flex";

        const solveCopy = document.createElement('button');

        const presssolveCopy1 = () => {
            solveCopy.style.borderBottom = '0px';
            solveCopy.style.marginBottom = '4px';
            solveCopy.style.top = '4px';
        };

// Function to revert the border-bottom when the button is released

        const releasesolveCopy1 = () => {
            solveCopy.style.borderBottom = '4px solid #2b70c9';
            solveCopy.style.marginBottom = '0px';
            solveCopy.style.top = '0px';
        };

// Add event listeners for mousedown, mouseup, and mouseleave

        solveCopy.addEventListener('mousedown', presssolveCopy1);
        solveCopy.addEventListener('mouseup', releasesolveCopy1);
        solveCopy.addEventListener('mouseleave', releasesolveCopy1);

        const pauseCopy = document.createElement('button');

        const presspauseCopy2 = () => {
            pauseCopy.style.borderBottom = '0px';
            pauseCopy.style.marginBottom = '4px';
            pauseCopy.style.top = '4px';
        };

// Function to revert the border-bottom when the button is released

        const releasepauseCopy2 = () => {
            pauseCopy.style.borderBottom = '4px solid #ff9600';
            pauseCopy.style.marginBottom = '0px';
            pauseCopy.style.top = '0px';
        };

// Add event listeners for mousedown, mouseup, and mouseleave

        pauseCopy.addEventListener('mousedown', presspauseCopy2);
        pauseCopy.addEventListener('mouseup', releasepauseCopy2);
        pauseCopy.addEventListener('mouseleave', releasepauseCopy2);

        solveCopy.id = 'solveAllButton';
        solveCopy.innerHTML = solvingIntervalId ? 'PAUSE SOLVE' : 'SOLVE ALL';
        solveCopy.disabled = false;
        pauseCopy.innerHTML = 'SOLVE';

        const defaultButtonStyle = `
        position: relative;
        min-width: 150px;
        font-size: 17px;
        border: none;
        border-bottom: 4px solid #2b70c9;
        border-radius: 16px;
        padding: 13px 16px;
        transform: translateZ(0);
        transition: filter .0s;
        font-weight: 700;
        letter-spacing: .8px;
        background: #1cb0f6;
        color: rgb(var(--color-snow));
        margin-left: 20px;
        cursor: pointer;
        `;

        const solveCopyStyle = `
        position: relative;
        min-width: 150px;
        font-size: 17px;
        border: none;
        border-bottom: 4px solid #2b70c9;
        border-radius: 16px;
        padding: 13px 16px;
        transform: translateZ(0);
        transition: filter .0s;
        font-weight: 700;
        letter-spacing: .8px;
        background: #1cb0f6;
        color: rgb(var(--color-snow));
        margin-left: 20px;
        cursor: pointer;
        `;

        const pauseCopyStyle = `
        position: relative;
        min-width: 100px;
        font-size: 17px;
        border: none;
        border-bottom: 4px solid #ff9600;
        border-radius: 16px;
        padding: 13px 16px;
        transform: translateZ(0);
        transition: filter .0s;
        font-weight: 700;
        letter-spacing: .8px;
        background: #ffc800;
        color: rgb(var(--color-snow));
        margin-left: 20px;
        cursor: pointer;
        `;

        solveCopy.style.cssText = solveCopyStyle;
        pauseCopy.style.cssText = pauseCopyStyle;

        [solveCopy, pauseCopy].forEach(button => {
            button.addEventListener("mousemove", () => {
                button.style.filter = "brightness(1.1)";
            });
        });

        [solveCopy, pauseCopy].forEach(button => {
            button.addEventListener("mouseleave", () => {
                button.style.filter = "none";
            });
        });

        original.parentElement.appendChild(pauseCopy);
        original.parentElement.appendChild(solveCopy);

        solveCopy.addEventListener('click', solving);
        pauseCopy.addEventListener('click', solve);

//        solving();
    }
}

setInterval(addSolvingButtons, 1000);

const htmlContent = ``;

// CSS content
const cssContent = `
.boxFirst {
  display: inline-flex;
  gap: 16px;
  flex-direction: column;
  position: fixed;
  align-items: flex-end;
  top: 100px;
  right: 16px;
  z-index: 2;
}

.ContactButton {
  position: relative;
  min-width: 50px;
  width: height;
  font-size: 17px;
  border: none;
  border: 2px solid rgb(var(--color-swan));
  border-bottom: 4px solid rgb(var(--color-swan));
  border-radius: 16px;
  padding: 13px 16px;
  transform: translateZ(0);
  transition: filter .0s;
  font-weight: 700;
  letter-spacing: .8px;
  background: rgb(var(--color-snow));
  color: rgb(var(--color-eel));
  text-align: center;
  cursor: pointer;
}

.ContactButton:hover {
  position: relative;
  min-width: 50px;
  font-size: 17px;
  border: none;
  border: 2px solid rgb(var(--color-swan));
  border-bottom: 4px solid rgb(var(--color-swan));
  border-radius: 16px;
  padding: 13px 16px;
  transform: translateZ(0);
  transition: filter .0s;
  font-weight: 700;
  letter-spacing: .8px;
  background: rgb(var(--color-snow));
  color: rgb(var(--color-eel));
  text-align: center;
  cursor: pointer;
        filter: brightness(0.9);
}

.ContactButton:active {
  position: relative;
  min-width: 50px;
  font-size: 17px;
  border: none;
  border: 2px solid rgb(var(--color-swan));
  border-bottom: 2px solid rgb(var(--color-swan));
  border-radius: 16px;
  padding: 13px 16px;
  transform: translateZ(0);
  transition: filter .0s;
  font-weight: 700;
  letter-spacing: .8px;
  background: rgb(var(--color-snow));
  color: rgb(var(--color-eel));
  text-align: center;
  cursor: pointer;
  margin-top: 2px;
  filter: brightness(0.9);
}
`;

// Function to inject HTML and CSS into the document
let injectedContainer = null;
let injectedStyleElement = null;

function injectContent() {

//    Check if the current URL matches the target URL
//    if (window.location.href === 'https://preview.duolingo.com/learn' || window.location.href === 'https://duolingo.com/learn') {
//    console.log('tageturlmatches')
//    Inject the content if it's not already injected

    if (!injectedContainer) {

        //Creating a container for the overlay

      injectedContainer = document.createElement('div');
      injectedContainer.innerHTML = htmlContent;
      document.body.appendChild(injectedContainer);

        //Creating a style tag for CSS

      injectedStyleElement = document.createElement('style');
      injectedStyleElement.type = 'text/css';
      injectedStyleElement.innerHTML = cssContent;
      document.head.appendChild(injectedStyleElement);
    } else {
//        console.log('tageturlnotmatches')
        //Remove the content if it was previously injected
//        if (injectedContainer) {
//        document.body.removeChild(injectedContainer);
//        document.head.removeChild(injectedStyleElement);
//        injectedContainer = null;
//        injectedStyleElement = null;
//    }
  }
}

// Check the URL and inject/remove content every 1 second

setInterval(injectContent, 1000);

function solving() {
    if (solvingIntervalId) {
        clearInterval(solvingIntervalId);
        solvingIntervalId = undefined;
        document.getElementById("solveAllButton").innerText = "SOLVE ALL";
        isAutoMode = false;
    } else {
        document.getElementById("solveAllButton").innerText = "PAUSE SOLVE";
        isAutoMode = true;
        solvingIntervalId = setInterval(solve, 500);
    }
}

function solve() {
    const selAgain = document.querySelectorAll('[data-test="player-practice-again"]');
    const practiceAgain = document.querySelector('[data-test="player-practice-again"]');
    if (selAgain.length === 1 && isAutoMode) {
        selAgain[0].click();
        return;
    }
    if (practiceAgain !== null && isAutoMode) {
        practiceAgain.click();
        return;
    }
    try {
        window.sol = findReact(document.getElementsByClassName('_3FiYg')[0]).props.currentChallenge;
    } catch {
        let next = document.querySelector('[data-test="player-next"]');
        if (next) {
            next.click();
        }
        return;
    }
    if (!window.sol) {
        return;
    }
    let nextButton = document.querySelector('[data-test="player-next"]');
    if (!nextButton) {
        return;
    }
    if (document.querySelectorAll('[data-test*="challenge-speak"]').length > 0) {
//        document.getElementById("solveAllButton").innerText = 'Challenge Speak';
        const buttonSkip = document.querySelector('button[data-test="player-skip"]');
        if (buttonSkip) {
            buttonSkip.click();
        }
    } else if (window.sol.type === 'listenMatch') {
        
//        document.getElementById("solveAllButton").innerText = 'Listen Match';

        console.log('hello');

        const nl = document.querySelectorAll('[data-test$="challenge-tap-token"]');
        window.sol.pairs?.forEach((pair) => {
            for (let i = 0; i < nl.length; i++) {
                let nlInnerText;
                if (nl[i].querySelectorAll('[data-test="challenge-tap-token-text"]').length > 1) {
                    nlInnerText = nl[i].querySelector('[data-test="challenge-tap-token-text"]').innerText.toLowerCase().trim();
                } else {
                    nlInnerText = nl[i].getAttribute('data-test').split('-')[0].toLowerCase().trim();
                    console.log(nlInnerText);
                }
                if (
                    (
                        nlInnerText === pair.learningWord.toLowerCase().trim() ||
                        nlInnerText === pair.translation.toLowerCase().trim()
                    ) &&
                    !nl[i].disabled
                ) {
                    nl[i].click();
                }
            }
        });
    } else if (document.querySelectorAll('[data-test="challenge-choice"]').length > 0) {

        // multiple choice question

//        document.getElementById("solveAllButton").innerText = 'Challenge Choice';
        
        if (window.sol.correctTokens !== undefined) {
            correctTokensRun();
            nextButton.click()
        } else if (window.sol.correctIndex !== undefined) {
            document.querySelectorAll('[data-test="challenge-choice"]')[window.sol.correctIndex].click();
            nextButton.click();
        }
    } else if (document.querySelectorAll('[data-test$="challenge-tap-token"]').length > 0) {

        // match the correct pairs question

        if (window.sol.pairs !== undefined) {
            
//            document.getElementById("solveAllButton").innerText = 'Pairs';
            
            let nl = document.querySelectorAll('[data-test$="challenge-tap-token"]');
            if (document.querySelectorAll('[data-test="challenge-tap-token-text"]').length === nl.length) {
                window.sol.pairs?.forEach((pair) => {
                    for (let i = 0; i < nl.length; i++) {
                        const nlInnerText = nl[i].querySelector('[data-test="challenge-tap-token-text"]').innerText.toLowerCase().trim();
                        try {
                            if (
                                (
                                    nlInnerText === pair.transliteration.toLowerCase().trim() ||
                                    nlInnerText === pair.character.toLowerCase().trim()
                                )
                                && !nl[i].disabled
                            ) {
                                nl[i].click()
                            }
                        } catch (TypeError) {
                            if (
                                (
                                    nlInnerText === pair.learningToken.toLowerCase().trim() ||
                                    nlInnerText === pair.fromToken.toLowerCase().trim()
                                )
                                && !nl[i].disabled
                            ) {
                                nl[i].click()
                            }
                        }
                    }
                })
            }
        } else if (window.sol.correctTokens !== undefined) {

//            document.getElementById("solveAllButton").innerText = 'Token Run';

            correctTokensRun();
            //nextButton.click()
        } else if (window.sol.correctIndices !== undefined) {

//            document.getElementById("solveAllButton").innerText = 'Indices Run';
            
            correctIndicesRun();
        }
    } else if (document.querySelectorAll('[data-test="challenge-tap-token-text"]').length > 0) {

        // fill in the gaps question

//        document.getElementById("solveAllButton").innerText = 'Challenge Tap Token Text';

        correctIndicesRun();
    } else if (document.querySelectorAll('[data-test="challenge-text-input"]').length > 0) {
        
//        document.getElementById("solveAllButton").innerText = 'Challenge Text Input';
        
        let elm = document.querySelectorAll('[data-test="challenge-text-input"]')[0];
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(elm, window.sol.correctSolutions ? window.sol.correctSolutions[0] : (window.sol.displayTokens ? window.sol.displayTokens.find(t => t.isBlank).text : window.sol.prompt));
        let inputEvent = new Event('input', {
            bubbles: true
        });

        elm.dispatchEvent(inputEvent);
    } else if (document.querySelectorAll('[data-test*="challenge-partialReverseTranslate"]').length > 0) {
        
//        document.getElementById("solveAllButton").innerText = 'Partial Reverse';
        
        let elm = document.querySelector('[data-test*="challenge-partialReverseTranslate"]')?.querySelector("span[contenteditable]");
        let nativeInputNodeTextSetter = Object.getOwnPropertyDescriptor(Node.prototype, "textContent").set
        //nativeInputNodeTextSetter.call(elm, '"' + window.sol?.displayTokens?.filter(t => t.isBlank)?.map(t => t.text)?.join()?.replaceAll(',', '') + '"');
        nativeInputNodeTextSetter.call(elm, '' + window.sol?.displayTokens?.filter(t => t.isBlank)?.map(t => t.text)?.join()?.replaceAll(',', '') + '');
        let inputEvent = new Event('input', {
            bubbles: true
        });

        elm.dispatchEvent(inputEvent);
    } else if (document.querySelectorAll('textarea[data-test="challenge-translate-input"]').length > 0) {

//        document.getElementById("solveAllButton").innerText = 'Challenge Translate Input';

        const elm = document.querySelector('textarea[data-test="challenge-translate-input"]');
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        //nativeInputValueSetter.call(elm, window.sol.correctSolutions ? window.sol.correctSolutions[0] : window.sol.prompt);

        if (window.sol.correctSolutions) {
            nativeInputValueSetter.call(elm, window.sol.correctSolutions ? window.sol.correctSolutions[0] : "error");
        } else {
            let nativeInputNodeTextSetter = Object.getOwnPropertyDescriptor(Node.prototype, "textContent").set
            nativeInputNodeTextSetter.call(elm, '' + window.sol?.displayTokens?.map(t => t.text)?.join()?.replaceAll(',', '') + '');
        }

        let inputEvent = new Event('input', {
            bubbles: true
        });

        elm.dispatchEvent(inputEvent);
    }
    if (isAutoMode) {
        nextButton.click();
    }
}

function correctTokensRun() {
    const all_tokens = document.querySelectorAll('[data-test$="challenge-tap-token"]');
    const correct_tokens = window.sol.correctTokens;
    const clicked_tokens = [];
    correct_tokens.forEach(correct_token => {
        const matching_elements = Array.from(all_tokens).filter(element => element.textContent.trim() === correct_token.trim());
        if (matching_elements.length > 0) {
            const match_index = clicked_tokens.filter(token => token.textContent.trim() === correct_token.trim()).length;
            if (match_index < matching_elements.length) {
                matching_elements[match_index].click();
                clicked_tokens.push(matching_elements[match_index]);
            } else {
                clicked_tokens.push(matching_elements[0]);
            }
        }
    });
}

function correctIndicesRun() {
    if (window.sol.correctIndices) {
        window.sol.correctIndices?.forEach(index => {
            document.querySelectorAll('div[data-test="word-bank"] [data-test="challenge-tap-token-text"]')[index].click();
        });
    }
}

function findSubReact(dom, traverseUp = 0) {
    const key = Object.keys(dom).find(key => key.startsWith("__reactProps$"));
    return dom.parentElement[key].children.props;
}

function findReact(dom, traverseUp = 0) {
    let reactProps = Object.keys(dom.parentElement).find((key) => key.startsWith("__reactProps$"));
    while (traverseUp-- > 0 && dom.parentElement) {
        dom = dom.parentElement;
        reactProps = Object.keys(dom.parentElement).find((key) => key.startsWith("__reactProps$"));
    }
    if(dom?.parentElement?.[reactProps]?.children[0] == null){
        return dom?.parentElement?.[reactProps]?.children[1]?._owner?.stateNode;
    } else{
        return dom?.parentElement?.[reactProps]?.children[0]?._owner?.stateNode;
    }
}

window.findReact = findReact;

window.ss = solving;
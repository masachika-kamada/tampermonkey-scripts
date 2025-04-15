// ==UserScript==
// @name         Streamlit Ctrl+Enter Sender
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Map Enter to Shift+Enter on specific conditions
// @author       Masachika Kamada
// @match        https://example.com/*  // Change this to the actual site URL
// @grant        none
// @run-at       document-start
// ==/UserScript==

/*
 * Note:
 * Before using this script, change the @match URL to the actual site URL where you want to apply this script.
 * For example, set it to https://example.com/*.
 */

(function() {
    'use strict';

    function handleCtrlEnter(event) {
        if (event.target.getAttribute("placeholder") !== "Message..." || !event.isTrusted) {
            return;
        }

        const isOnlyEnter = (event.code === "Enter") && !(event.ctrlKey || event.metaKey);
        const isCtrlEnter = (event.code === "Enter") && event.ctrlKey;

        if (isOnlyEnter || isCtrlEnter) {
            event.stopImmediatePropagation();

            let eventConfig = {
                key: "Enter",
                code: "Enter",
                bubbles: true,
                cancelable: true,
                shiftKey: isOnlyEnter
            };

            const newEvent = new KeyboardEvent("keydown", eventConfig);
            event.target.dispatchEvent(newEvent);
        }
    }

    function enableSendingWithCtrlEnter() {
        document.addEventListener("keydown", handleCtrlEnter, { capture: true });
    }

    enableSendingWithCtrlEnter();
})();

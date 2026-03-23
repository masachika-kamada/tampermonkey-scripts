// ==UserScript==
// @name         D365 Show Field Logical Names
// @namespace    https://dynamics.microsoft.com/
// @version      1.0
// @description  Dynamics 365 Model-Driven App のフォーム上にフィールドの論理名を表示する
// @match        https://*.dynamics.com/main.aspx*
// @match        https://*.crm*.dynamics.com/*
// @match        https://*.dynamics.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    let isActive = false;
    let menuId = null;
    const BADGE_CLASS = 'tm-logical-name';
    const STYLE_ID = 'tm-logical-name-style';

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .${BADGE_CLASS} {
                display: inline-block;
                background: #1b6ec2;
                color: #fff;
                font-size: 10px;
                font-family: Consolas, monospace;
                padding: 1px 5px;
                border-radius: 3px;
                margin-left: 6px;
                vertical-align: middle;
                user-select: all;
                cursor: text;
                line-height: 1.4;
            }
        `;
        document.head.appendChild(style);
    }

    function getXrm() {
        // UCI の iframe 構造を考慮して Xrm を取得
        if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.ui) return Xrm;
        // iframe 内の Xrm を探す
        const frames = document.querySelectorAll('iframe');
        for (const frame of frames) {
            try {
                const w = frame.contentWindow;
                if (w && w.Xrm && w.Xrm.Page && w.Xrm.Page.ui) return w.Xrm;
            } catch (e) { /* cross-origin */ }
        }
        return null;
    }

    function removeBadges(doc) {
        doc = doc || document;
        doc.querySelectorAll('.' + BADGE_CLASS).forEach(el => el.remove());
        // iframe 内も処理
        doc.querySelectorAll('iframe').forEach(frame => {
            try {
                if (frame.contentDocument) {
                    frame.contentDocument.querySelectorAll('.' + BADGE_CLASS).forEach(el => el.remove());
                }
            } catch (e) { /* cross-origin */ }
        });
    }

    function showLogicalNames() {
        const xrm = getXrm();
        if (!xrm) {
            console.warn('[D365 Logical Names] Xrm not found. フォームページで実行してください。');
            return;
        }

        removeBadges(document);

        const controls = xrm.Page.ui.controls;
        if (!controls) return;

        controls.forEach(function (ctrl) {
            const name = ctrl.getName();
            if (!name) return;

            const docs = [document];
            document.querySelectorAll('iframe').forEach(function (frame) {
                try { if (frame.contentDocument) docs.push(frame.contentDocument); } catch (e) {}
            });

            let labelEl = null;
            for (const doc of docs) {
                // 1. フィールドコンテナを完全一致で探し、その中のラベルを取得
                const container = doc.querySelector(`[data-id="${name}"]`);
                if (container) {
                    labelEl = container.querySelector(`[data-id="${name}-field-label"]`)
                           || container.querySelector('label');
                    if (labelEl) break;
                }
                // 2. コンテナが見つからない場合、完全一致 ID でラベルを直接検索
                labelEl = doc.querySelector(`[id="${name}-field-label"]`);
                if (labelEl) break;
            }

            if (labelEl) {
                const span = document.createElement('span');
                span.className = BADGE_CLASS;
                span.textContent = name;
                span.title = 'Logical Name: ' + name;
                labelEl.appendChild(span);
            }
        });
    }

    function registerMenu() {
        if (menuId !== null) {
            GM_unregisterMenuCommand(menuId);
        }
        const label = isActive ? '✅ 論理名を非表示にする' : '📋 論理名を表示する';
        menuId = GM_registerMenuCommand(label, function () {
            isActive = !isActive;
            if (isActive) {
                injectStyle();
                showLogicalNames();
            } else {
                removeBadges(document);
            }
            registerMenu();
        });
    }

    registerMenu();
})();

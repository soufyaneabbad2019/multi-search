/** @odoo-module **/

import { SearchBar } from "@web/search/search_bar/search_bar";
import { patch } from "@web/core/utils/patch";
import { onMounted, onWillUnmount } from "@odoo/owl";

function extractMultiValues(query) {
    const q = (query || "").trim();
    if (!q) return null;
    const m = q.match(/^\{(.+?)\}$/s);
    if (m) {
        const vals = m[1].split(/\s+/).filter(Boolean);
        return vals.length > 1 ? vals : null;
    }
    if (q.includes("\n") || q.includes("\t")) {
        const vals = q.split(/[\r\n\t]+/).map(v => v.trim()).filter(Boolean);
        return vals.length > 1 ? vals : null;
    }
    return null;
}

function waitForItems(getItems, timeout = 1000) {
    return new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
            const items = getItems();
            if (items?.find(i => i.searchItemId)) {
                return resolve(items);
            }
            if (Date.now() - start > timeout) {
                return resolve(items);
            }
            setTimeout(check, 30);
        };
        check();
    });
}

patch(SearchBar.prototype, "sa_multi_search.SearchBar", {
    setup() {
        this._super();
        let _keyHandler = null;
        let _pasteHandler = null;

        // Adds every value directly through the search model instead of calling
        // selectItem() in a loop -- addAutoCompletionValues() is the underlying
        // call selectItem() itself delegates to, verified identical across
        // 15.0/16.0/17.0/18.0/19.0, so this stays stable across versions.
        const addValues = (template, values) => {
            const { searchItemId, operator, fieldType } = template;
            const fallbackOperator = ["selection", "boolean", "tags"].includes(fieldType) ? "=" : "ilike";
            for (const value of values) {
                this.env.searchModel.addAutoCompletionValues(searchItemId, {
                    label: value,
                    value: value,
                    operator: operator || fallbackOperator,
                });
            }
            this.resetState();
        };

        onMounted(() => {
            const input = document.querySelector(".o_searchview_input");
            if (!input) return;

            _keyHandler = (ev) => {
                if (ev.key !== "Enter" || ev.isComposing) return;
                const query = input.value || "";
                const values = extractMultiValues(query);
                if (!values) return;

                const template = this.items?.find(i => i.searchItemId);
                if (!template) return;

                ev.preventDefault();
                ev.stopPropagation();

                addValues(template, values);
                input.value = "";
            };

            _pasteHandler = async (ev) => {
                const raw = (ev.clipboardData || window.clipboardData).getData("text");
                const values = extractMultiValues(raw);
                if (!values) return;

                ev.preventDefault();
                ev.stopPropagation();

                // Déclencher le vrai handler OWL via un événement input natif
                input.value = values[0];
                input.dispatchEvent(new Event("input", { bubbles: true }));

                // Attendre qu'OWL ait calculé les items
                await waitForItems(() => this.items);

                const template = this.items?.find(i => i.searchItemId);
                if (!template) return;

                addValues(template, values);
                input.value = "";
            };

            input.addEventListener("keydown", _keyHandler, true);
            input.addEventListener("paste", _pasteHandler, true);
        });

        onWillUnmount(() => {
            const input = document.querySelector(".o_searchview_input");
            if (!input) return;
            if (_keyHandler) input.removeEventListener("keydown", _keyHandler, true);
            if (_pasteHandler) input.removeEventListener("paste", _pasteHandler, true);
        });
    },
});

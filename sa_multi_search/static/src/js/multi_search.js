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

patch(SearchBar.prototype, {
    setup() {
        super.setup();
        let _keyHandler = null;
        let _pasteHandler = null;

        onMounted(() => {
            const input = document.querySelector(".o_searchview_input");
            if (!input) return;

            _keyHandler = async (ev) => {
                if (ev.key !== "Enter" || ev.isComposing) return;
                const query = input.value || "";
                const values = extractMultiValues(query);
                if (!values) return;

                const template = this.items?.find(i => i.searchItemId);
                if (!template) return;

                ev.preventDefault();
                ev.stopPropagation();

                for (const value of values) {
                    await this.selectItem({ ...template, label: value, value: value });
                }
                input.value = "";
                this.state.query = "";
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

                for (const value of values) {
                    await this.selectItem({ ...template, label: value, value: value });
                }
                input.value = "";
                this.state.query = "";
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
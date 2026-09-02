odoo.define('sa_multi_search.SearchBar15', function (require) {
"use strict";

// 15.0's list/kanban/form views still render through the LEGACY search bar
// (addons/web/static/src/legacy/js/control_panel/search_bar.js, loaded via
// odoo.define('web.SearchBar', ...)), not the newer ES-module SearchBar at
// @web/search/search_bar/search_bar (that one is only used by graph/pivot
// in 15.0). Its shape matches 14.0's: constructor-built
// this.autoCompleteSources, this.state.inputValue, mounted()/willUnmount()
// as plain prototype methods, and this.model.dispatch('addAutoCompletionValues',
// ...) as the underlying call a single manual pick makes.

var SearchBar = require('web.SearchBar');

function extractMultiValues(query) {
    var q = (query || "").trim();
    if (!q) return null;
    var m = q.match(/^\{([\s\S]+?)\}$/);
    if (m) {
        var vals = m[1].split(/\s+/).filter(Boolean);
        return vals.length > 1 ? vals : null;
    }
    if (q.indexOf("\n") !== -1 || q.indexOf("\t") !== -1) {
        var vals2 = q.split(/[\r\n\t]+/).map(function (v) { return v.trim(); }).filter(Boolean);
        return vals2.length > 1 ? vals2 : null;
    }
    return null;
}

function saApplyMultiValues(searchBarInstance, values) {
    var source = searchBarInstance.autoCompleteSources && searchBarInstance.autoCompleteSources[0];
    if (!source) return false;
    values.forEach(function (v) {
        var value = ("value" in source)
            ? source.value
            : (typeof searchBarInstance._parseWithSource === 'function' ? searchBarInstance._parseWithSource(v, source) : v);
        searchBarInstance.model.dispatch('addAutoCompletionValues', {
            filterId: source.filterId,
            value: value,
            label: v,
            operator: source.filterOperator || source.operator,
        });
    });
    return true;
}

var _saSuperMounted = SearchBar.prototype.mounted;
SearchBar.prototype.mounted = function () {
    if (_saSuperMounted) {
        _saSuperMounted.apply(this, arguments);
    }
    var self = this;
    var input = this.inputRef && this.inputRef.el;
    if (!input) return;

    // Native listeners directly on the input (capture phase) rather than
    // overriding an internal handler by name -- doesn't depend on knowing
    // the exact keydown method the legacy template wires up.
    this._saKeyHandler = function (ev) {
        if (ev.key !== 'Enter' || ev.isComposing) return;
        var values = extractMultiValues(self.state.inputValue);
        if (!values) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (saApplyMultiValues(self, values)) {
            self.state.inputValue = "";
            input.value = "";
        }
    };

    this._saPasteHandler = function (ev) {
        var raw = (ev.clipboardData || window.clipboardData).getData('text');
        var values = extractMultiValues(raw);
        if (!values) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (saApplyMultiValues(self, values)) {
            self.state.inputValue = "";
            input.value = "";
        }
    };

    input.addEventListener('keydown', this._saKeyHandler, true);
    input.addEventListener('paste', this._saPasteHandler, true);
};

var _saSuperWillUnmount = SearchBar.prototype.willUnmount;
SearchBar.prototype.willUnmount = function () {
    var input = this.inputRef && this.inputRef.el;
    if (input) {
        if (this._saKeyHandler) input.removeEventListener('keydown', this._saKeyHandler, true);
        if (this._saPasteHandler) input.removeEventListener('paste', this._saPasteHandler, true);
    }
    if (_saSuperWillUnmount) {
        _saSuperWillUnmount.apply(this, arguments);
    }
};

return SearchBar;

});

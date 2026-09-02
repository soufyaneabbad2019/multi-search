odoo.define('sa_multi_search.SearchBar14', function (require) {
"use strict";

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

// this.autoCompleteSources is already exclusively field-type sources, built
// once in the constructor from this.model.get('filters', f => f.type ===
// 'field'). We reuse the exact same call _selectSource() makes
// (model.dispatch('addAutoCompletionValues', ...)) once per pasted/typed
// value instead of once for a single autocomplete pick.
function saApplyMultiValues(searchBarInstance, values) {
    var source = searchBarInstance.autoCompleteSources && searchBarInstance.autoCompleteSources[0];
    if (!source) return false;
    values.forEach(function (v) {
        searchBarInstance.model.dispatch('addAutoCompletionValues', {
            filterId: source.filterId,
            value: ("value" in source) ? source.value : searchBarInstance._parseWithSource(v, source),
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
    var input = this.inputRef && this.inputRef.el;
    if (!input) return;
    this._saPasteHandler = this._onSaMultiPaste.bind(this);
    input.addEventListener('paste', this._saPasteHandler, true);
};

var _saSuperWillUnmount = SearchBar.prototype.willUnmount;
SearchBar.prototype.willUnmount = function () {
    var input = this.inputRef && this.inputRef.el;
    if (input && this._saPasteHandler) {
        input.removeEventListener('paste', this._saPasteHandler, true);
    }
    if (_saSuperWillUnmount) {
        _saSuperWillUnmount.apply(this, arguments);
    }
};

SearchBar.prototype._onSaMultiPaste = function (ev) {
    var raw = (ev.clipboardData || window.clipboardData).getData('text');
    var values = extractMultiValues(raw);
    if (!values) return;
    ev.preventDefault();
    if (saApplyMultiValues(this, values)) {
        this.state.inputValue = "";
        if (this.inputRef && this.inputRef.el) {
            this.inputRef.el.value = "";
        }
    }
};

var _saSuperOnSearchKeydown = SearchBar.prototype._onSearchKeydown;
SearchBar.prototype._onSearchKeydown = function (ev) {
    if (ev.key === 'Enter' && !ev.isComposing) {
        var values = extractMultiValues(this.state.inputValue);
        if (values) {
            ev.preventDefault();
            if (saApplyMultiValues(this, values)) {
                this.state.inputValue = "";
                if (this.inputRef && this.inputRef.el) {
                    this.inputRef.el.value = "";
                }
            }
            return;
        }
    }
    return _saSuperOnSearchKeydown.apply(this, arguments);
};

return SearchBar;

});

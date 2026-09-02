odoo.define('sa_multi_search.SearchBar13', function (require) {
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

SearchBar.include({

    start: function () {
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            var input = self.el.querySelector('.o_searchview_input');
            if (!input) return;
            self._saInput = input;
            self._saKeyHandler = self._onSaMultiKeydown.bind(self);
            self._saPasteHandler = self._onSaMultiPaste.bind(self);
            input.addEventListener('keydown', self._saKeyHandler, true);
            input.addEventListener('paste', self._saPasteHandler, true);
        });
    },

    destroy: function () {
        if (this._saInput) {
            this._saInput.removeEventListener('keydown', this._saKeyHandler, true);
            this._saInput.removeEventListener('paste', this._saPasteHandler, true);
        }
        return this._super.apply(this, arguments);
    },

    // this.filterFields is already exclusively type:'field' filters, built
    // synchronously in start() -- no need to wait for the jQuery UI
    // autocomplete dropdown to compute anything.
    _saApplyMultiValues: function (values) {
        var filter = this.filterFields && this.filterFields[0];
        if (!filter) return false;
        var operator = (filter.attrs && filter.attrs.operator) || 'ilike';
        var existing = filter.autoCompleteValues || [];
        var newOnes = values.map(function (v) {
            return { label: v, value: v, operator: operator };
        });
        this.trigger_up('autocompletion_filter', {
            filterId: filter.id,
            autoCompleteValues: existing.concat(newOnes),
        });
        return true;
    },

    _onSaMultiKeydown: function (ev) {
        if (ev.key !== 'Enter' || ev.isComposing) return;
        var query = this._saInput.value || "";
        var values = extractMultiValues(query);
        if (!values) return;
        if (this._saApplyMultiValues(values)) {
            ev.preventDefault();
            ev.stopPropagation();
            this._saInput.value = '';
        }
    },

    _onSaMultiPaste: function (ev) {
        var raw = (ev.clipboardData || window.clipboardData).getData('text');
        var values = extractMultiValues(raw);
        if (!values) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (this._saApplyMultiValues(values)) {
            this._saInput.value = '';
        }
    },

});

return SearchBar;

});

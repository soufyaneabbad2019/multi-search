# -*- coding: utf-8 -*-
{
    'name': 'Multi Search',
    'version': '18.0.1.0.0',
    'category': 'Tools',
    'summary': 'Search multiple records at once by pasting from Excel or using { } syntax',
    'description': """
Multi Search — Search multiple values at once in any Odoo view.

Two ways to use it:
- Paste a column from Excel directly into the search bar
- Type { REF001 REF002 REF003 } and press Enter

Works with any search field: Internal Reference, Product Name, Barcode, Order Number, Partner Name, etc.
Works on any Odoo view: Products, Sales Orders, Purchase Orders, Inventory, Manufacturing Orders, Contacts, and more.
    """,
    'author': 'Soufyane Abbad',
    'website': 'https://www.linkedin.com/in/soufyane-abbad',
    'license': 'OPL-1',
    'price': 25.0,
    'currency': 'EUR',
    'depends': ['web'],
    'assets': {
        'web.assets_backend': [
            'sa_multi_search/static/src/js/multi_search.js',
        ],
    },
    'images': [
        'static/description/banner.png',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
}

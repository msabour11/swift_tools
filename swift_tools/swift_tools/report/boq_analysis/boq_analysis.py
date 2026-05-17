# Copyright (c) 2026, Mohamed AbdElsabour and contributors
# For license information, please see license.txt


import frappe
from frappe import _


def execute(filters=None):
    filters = filters or {}
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {
            "label": _("Section"),
            "fieldname": "section",
            "fieldtype": "Data",
            "width": 180,
        },
        {
            "label": _("#"),
            "fieldname": "idx",
            "fieldtype": "Int",
            "width": 50,
        },
        {
            "label": _("Item Code"),
            "fieldname": "item_code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 160,
        },
        {
            "label": _("Item Name"),
            "fieldname": "item_name",
            "fieldtype": "Data",
            "width": 180,
        },
        {
            "label": _("Description"),
            "fieldname": "description",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": _("UOM"),
            "fieldname": "uom",
            "fieldtype": "Data",
            "width": 80,
        },
        {
            "label": _("Qty"),
            "fieldname": "qty",
            "fieldtype": "Float",
            "width": 80,
        },
        {
            "label": _("Rate"),
            "fieldname": "rate",
            "fieldtype": "Currency",
            "width": 110,
        },
        {
            "label": _("Amount"),
            "fieldname": "amount",
            "fieldtype": "Currency",
            "width": 120,
        },
        {
            "label": _("Install Amount"),
            "fieldname": "install_amount",
            "fieldtype": "Currency",
            "width": 120,
        },
        {
            "label": _("Total Amount"),
            "fieldname": "total_amount",
            "fieldtype": "Currency",
            "width": 130,
        },
        {
            "label": _("BOQ"),
            "fieldname": "boq",
            "fieldtype": "Link",
            "options": "Bill of Quantity",
            "width": 150,
        },
        {
            "label": _("Customer"),
            "fieldname": "customer",
            "fieldtype": "Link",
            "options": "Customer",
            "width": 130,
        },
        {
            "label": _("Tender"),
            "fieldname": "tender",
            "fieldtype": "Data",
            "width": 150,
        },
    ]


def get_data(filters):
    conditions = get_conditions(filters)
    data = []

    # ── section definitions ──────────────────────────────────────────────────
    # Each entry: (child_doctype, parentfield, display_label, total_field)
    sections = [
        (
            "Raw Materials Items",
            "raw_materials",
            _("Raw Materials"),
            "total_raw_materials",
        ),
        (
            "Wages and Labor Items",
            "wages_and_employment",
            _("Wages & Employment"),
            "total_wages_and_employment",
        ),
        (
            "Subcontractors Items",
            "subcontractors",
            _("Subcontractors"),
            "total_subcontractors",
        ),
        (
            "Equipment Depreciation Item",
            "equipment_depreciation",
            _("Equipment Depreciation"),
            "total_equipment_depreciation",
        ),
        (
            "Housing Allowance Item",
            "housing_allowance",
            _("Housing Allowance"),
            "total_housing_allowance",
        ),
    ]

    # Fetch parent BOQ records that match the filters
    boq_list = frappe.db.sql(
        f"""
        SELECT
            name,
            customer,
            customer_name,
            tender,
            transaction_date,
            item_code,
            item_name,
            company,
            total_raw_materials,
            total_wages_and_employment,
            total_subcontractors,
            total_equipment_depreciation,
            total_housing_allowance,
            general_expenses,
            general_expenses_amount,
            risk_expenses,
            risk_expenses_amount,
            total
        FROM `tabBill of Quantity`
        WHERE docstatus < 2
        {conditions}
        ORDER BY transaction_date DESC, name DESC
        """,
        filters,
        as_dict=True,
    )

    for boq in boq_list:
        boq_added = False  # track whether we already appended the BOQ header row

        for child_doctype, parentfield, section_label, total_field in sections:
            rows = frappe.db.sql(
                f"""
                SELECT
                    idx,
                    item_code,
                    item_name,
                    description,
                    uom,
                    qty,
                    rate,
                    amount,
                    install_amount,
                    total_amount
                FROM `tab{child_doctype}`
                WHERE parent = %s
                ORDER BY idx ASC
                """,
                boq.name,
                as_dict=True,
            )

            if not rows:
                continue

            # Section header row (bold via indent_level trick or a blank section marker)
            data.append(
                _make_section_header(
                    section_label,
                    boq[total_field],
                    boq,
                )
            )

            for row in rows:
                data.append(
                    {
                        "section": "",
                        "idx": row.idx,
                        "item_code": row.item_code,
                        "item_name": row.item_name,
                        "description": row.description,
                        "uom": row.uom,
                        "qty": row.qty,
                        "rate": row.rate,
                        "amount": row.amount,
                        "install_amount": row.install_amount,
                        "total_amount": row.total_amount,
                        "boq": boq.name,
                        "customer": boq.customer,
                        "tender": boq.tender,
                        # indent child rows so ERPNext tree-style rendering works
                        "indent": 1,
                    }
                )

            # Section subtotal row
            data.append(
                _make_subtotal_row(
                    _("Subtotal — {0}").format(section_label),
                    boq[total_field],
                    boq,
                )
            )

        # ── Expense & grand-total summary rows ───────────────────────────────
        if boq_list:
            data.append(
                _make_subtotal_row(
                    _("General Expenses ({0}%)").format(boq.general_expenses),
                    boq.general_expenses_amount,
                    boq,
                    is_expense=True,
                )
            )
            data.append(
                _make_subtotal_row(
                    _("Risk Expenses ({0}%)").format(boq.risk_expenses),
                    boq.risk_expenses_amount,
                    boq,
                    is_expense=True,
                )
            )
            data.append(
                _make_subtotal_row(
                    _("Grand Total"),
                    boq.total,
                    boq,
                    is_grand=True,
                )
            )

            # Blank separator between BOQ documents
            data.append({})

    return data


# ── helpers ──────────────────────────────────────────────────────────────────


def _make_section_header(label, total, boq):
    """Bold section header row (no item detail columns)."""
    return {
        "section": label,
        "idx": None,
        "item_code": None,
        "item_name": None,
        "description": None,
        "uom": None,
        "qty": None,
        "rate": None,
        "amount": None,
        "install_amount": None,
        "total_amount": total,
        "boq": boq.name,
        "customer": boq.customer,
        "tender": boq.tender,
        "indent": 0,
        "bold": 1,
    }


def _make_subtotal_row(label, amount, boq, is_expense=False, is_grand=False):
    """Summary/subtotal rows appended after each section."""
    return {
        "section": label,
        "idx": None,
        "item_code": None,
        "item_name": None,
        "description": None,
        "uom": None,
        "qty": None,
        "rate": None,
        "amount": None,
        "install_amount": None,
        "total_amount": amount,
        "boq": boq.name,
        "customer": boq.customer,
        "tender": boq.tender,
        "indent": 0,
        "bold": 1 if is_grand else 0,
    }


def get_conditions(filters):
    """Build WHERE-clause fragments from report filters."""
    conditions = []

    if filters.get("company"):
        conditions.append("AND company = %(company)s")

    if filters.get("customer"):
        conditions.append("AND customer = %(customer)s")

    if filters.get("tender"):
        conditions.append("AND tender = %(tender)s")

    if filters.get("from_date"):
        conditions.append("AND transaction_date >= %(from_date)s")

    if filters.get("to_date"):
        conditions.append("AND transaction_date <= %(to_date)s")

    if filters.get("boq"):
        conditions.append("AND name = %(boq)s")

    return " ".join(conditions)

import frappe


def after_install():
    item_types = ["LTL", "FTL", "Express"]
    for name in item_types:
        if not frappe.db.exists("Item Type", name):
            frappe.get_doc(
                {
                    "doctype": "Item Type",
                    "type": name,
                }
            ).insert()

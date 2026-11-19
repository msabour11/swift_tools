// frappe.ui.form.on("Sales Order", {
// 	refresh: function (frm) {
// 		frm.set_query("item_code", "items", function () {
// 			return {
// 				filters: {
// 					item_type: frm.doc.item_type,
// 				},
// 			};
// 		});

// 		if (!frm.is_new()) {
// 			frm.add_custom_button(
// 				__("Purchase Order"),
// 				function () {
// 					frappe.model.with_doctype("Purchase Order", function () {
// 						let po = frappe.model.get_new_doc("Purchase Order");

// 						if (frm.doc.custom_car_owner) {
// 							po.supplier = frm.doc.custom_car_owner;
// 						}

// 						(frm.doc.items || []).forEach(function (row) {
// 							let child = frappe.model.add_child(po, "items");
// 							child.item_code = row.item_code;
// 							child.item_name = row.item_name;
// 							child.description = row.description;
// 							child.qty = row.qty;
// 							child.uom = row.uom;
// 							child.schedule_date =
// 								row.delivery_date ||
// 								frm.doc.delivery_date ||
// 								frappe.datetime.get_today();
// 						});

// 						frappe.set_route("Form", "Purchase Order", po.name);
// 					});
// 				},
// 				__("Create"),
// 			);
// 		}
// 	},
// 	item_type: function (frm) {
// 		frm.set_query("item_code", "items", function () {
// 			return {
// 				filters: {
// 					item_type: frm.doc.item_type,
// 				},
// 			};
// 		});
// 	},
// });

// frappe.ui.form.on("Sales Order Item", {
// 	custom_trans_charge: function (frm, cdt, cdn) {
// 		calculate_rate(frm, cdt, cdn);
// 	},
// 	custom_other_charge: function (frm, cdt, cdn) {
// 		calculate_rate(frm, cdt, cdn);
// 	},
// });

// function calculate_rate(frm, cdt, cdn) {
// 	var row = locals[cdt][cdn];
// 	let trans_charge = flt(row.custom_trans_charge);
// 	let other_charge = flt(row.custom_other_charge);
// 	let new_rate = trans_charge + other_charge;

// 	frappe.model.set_value(cdt, cdn, "rate", new_rate, () => {
// 		frm.refresh_field("items");
// 	});
// }


//////////////////////
frappe.ui.form.on("Sales Order", {
	refresh: function (frm) {
		frm.set_query("item_code", "items", function () {
			return {
				filters: {
					item_type: frm.doc.item_type,
				},
			};
		});

		// only submitted Sales Orders can be linked to a Purchase Order
		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(
				__("Purchase Order"),
				function () {
					// 1. Define parent fields to pass to the new document
					let opts = {};
					if (frm.doc.custom_car_owner) {
						opts.supplier = frm.doc.custom_car_owner;
						opts.company = frm.doc.company;
					}

					// 2. Use frappe.new_doc to create, map, and route safely
					frappe.new_doc("Purchase Order", opts, function (po) {
						// 3. Map the child table items in the initialization callback
						(frm.doc.items || []).forEach(function (row) {
							let child = frappe.model.add_child(po, "items");
							child.item_code = row.item_code;
							child.item_name = row.item_name;
							child.description = row.description;
							child.qty = row.qty;
							child.uom = row.uom;
							// link back to the Sales Order (Connections tab + ordered_qty)
							child.sales_order = frm.doc.name;
							child.sales_order_item = row.name;
							child.schedule_date =
								row.delivery_date ||
								frm.doc.delivery_date ||
								frappe.datetime.get_today();
						});
					});
				},
				__("Create"),
			);
		}
	},
	item_type: function (frm) {
		frm.set_query("item_code", "items", function () {
			return {
				filters: {
					item_type: frm.doc.item_type,
				},
			};
		});
	},
});

frappe.ui.form.on("Sales Order Item", {
	custom_trans_charge: function (frm, cdt, cdn) {
		calculate_rate(frm, cdt, cdn);
	},
	custom_other_charge: function (frm, cdt, cdn) {
		calculate_rate(frm, cdt, cdn);
	},
});

function calculate_rate(frm, cdt, cdn) {
	var row = locals[cdt][cdn];
	let trans_charge = flt(row.custom_trans_charge);
	let other_charge = flt(row.custom_other_charge);
	let new_rate = trans_charge + other_charge;

	frappe.model.set_value(cdt, cdn, "rate", new_rate, () => {
		frm.refresh_field("items");
	});
}

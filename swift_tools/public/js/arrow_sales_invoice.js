frappe.ui.form.on("Sales Invoice", {
	refresh: function (frm) {
		frm.set_query("item_code", "items", function () {
			return {
				filters: {
					item_type: frm.doc.item_type,
				},
			};
		});
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

frappe.ui.form.on("Sales Invoice Item", {
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

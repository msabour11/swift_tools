frappe.ui.form.on("Sales Invoice", {
	refresh: function (frm) {
		frm.set_query("item_code", "items", function () {
			return {
				filters: {
					custom_item_type: frm.doc.custom_item_type,
				},
			};
		});
	},
	custom_item_type: function (frm) {
		frm.set_query("item_code", "items", function () {
			return {
				filters: {
					custom_item_type: frm.doc.custom_item_type,
				},
			};
		});
	},
});

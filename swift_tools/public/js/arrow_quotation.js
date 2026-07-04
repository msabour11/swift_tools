frappe.ui.form.on("Quotation", {
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

frappe.ui.form.on("Payment Schedule", {
	invoice_portion: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		// if (row.invoice_portion > 100) {
		// 	frappe.msgprint(__("Invoice Portion cannot be greater than 100%"));
		// 	row.invoice_portion = 100;
		// 	frm.refresh_field("payment_schedule");
		// }
		let payment_amount = (row.invoice_portion / 100) * frm.doc.grand_total;
		row.payment_amount = payment_amount;
		frm.refresh_field("payment_schedule");
	},
});

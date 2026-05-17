// // Copyright (c) 2026, Mohamed AbdElsabour and contributors
// // For license information, please see license.txt

// frappe.query_reports["Boq Analysis"] = {
// 	filters: [
// 		{
// 			fieldname: "boq",
// 			label: __("Bill of Quantity"),
// 			fieldtype: "Link",
// 			options: "Bill of Quantity",
// 			reqd: 1,
// 			get_query: function () {
// 				return {
// 					filters: {
// 						docstatus: ["!=", 2], // Exclude cancelled
// 					},
// 				};
// 			},
// 		},
// 	],

// 	// Optional: formatter for custom row styling
// 	formatter: function (value, row, column, data, default_formatter) {
// 		if (!data) return default_formatter(value, row, column, data);

// 		value = default_formatter(value, row, column, data);

// 		// Style section headers
// 		if (data.row_type === "section_header") {
// 			value = `<span style="font-weight: bold; font-size: 13px; color: #1a73e8;">${value}</span>`;
// 		}

// 		// Style subtotals
// 		if (data.row_type === "subtotal") {
// 			value = `<span style="font-weight: bold; color: #e65100;">${value}</span>`;
// 		}

// 		// Style grand total
// 		if (data.row_type === "grand_total") {
// 			value = `<span style="font-weight: bold; font-size: 14px; color: #2e7d32; background: #e8f5e9; padding: 2px 6px; border-radius: 3px;">${value}</span>`;
// 		}

// 		return value;
// 	},
// };

frappe.query_reports["Boq Analysis"] = {
	filters: [
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			default: frappe.defaults.get_user_default("Company"),
		},
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.month_start(),
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.month_end(),
		},
		{
			fieldname: "customer",
			label: __("Customer"),
			fieldtype: "Link",
			options: "Customer",
		},
		{
			fieldname: "tender",
			label: __("Tender"),
			fieldtype: "Link",
			options: "Tender",
			get_query: function () {
				let customer = frappe.query_report.get_filter_value("customer");
				return {
					filters: customer ? { customer: customer } : {},
				};
			},
		},
		{
			fieldname: "boq",
			label: __("BOQ"),
			fieldtype: "Link",
			options: "Bill of Quantity",
			get_query: function () {
				let customer = frappe.query_report.get_filter_value("customer");
				let tender = frappe.query_report.get_filter_value("tender");
				let filters = {};
				if (customer) filters["customer"] = customer;
				if (tender) filters["tender"] = tender;
				return { filters };
			},
		},
	],

	onload: function (report) {
		report.page.add_inner_button(__("Refresh"), function () {
			frappe.query_report.refresh();
		});
	},
};

frappe.ui.form.on("Task", {
	refresh: function (frm) {},
	after_save: function (frm) {
		if (frm.doc.parent_task) {
			// Fetch all sibling tasks (children of the same parent)
			frappe.db
				.get_list("Task", {
					filters: { parent_task: frm.doc.parent_task },
					fields: ["progress"],
				})
				.then((tasks) => {
					if (tasks && tasks.length > 0) {
						let total_progress = 0;
						tasks.forEach((t) => {
							total_progress += parseFloat(t.progress) || 0;
						});
						let avg_progress = total_progress / tasks.length;

						// Update the parent task with the new average progress
						frappe.db
							.set_value("Task", frm.doc.parent_task, "progress", avg_progress)
							.then(() => {
								frappe.show_alert({
									message: __("Parent Task progress updated to {0}%", [
										avg_progress.toFixed(2),
									]),
									indicator: "green",
								});
							});
					}
				});
		}
	},
	validate: function (frm) {
		if (frm.doc.is_milestone == 1) {
			return;
		}
		// Run validation only when a user attempts to execute/work on the task
		if (
			frm.doc.project &&
			frm.doc.exp_start_date &&
			["Working", "Completed"].includes(frm.doc.status)
		) {
			return new Promise((resolve, reject) => {
				frappe.db
					.get_list("Task", {
						filters: {
							project: frm.doc.project,
							status: ["in", ["Open", "Overdue", "Pending Review"]], // Statuses indicating the task hasn't executed
							exp_start_date: ["<", frm.doc.exp_start_date],

							name: ["!=", frm.doc.name],
						},
						fields: ["name", "is_group", "is_milestone", "parent_task", "progress"],
					})
					.then((tasks) => {
						let has_error = false;

						// Validation 1: Same project, is_group = 1, is_milestone = 1
						if (frm.doc.is_group == 1 && frm.doc.is_milestone == 1) {
							let older_milestones = tasks.filter(
								(d) => d.is_group == 1 && d.is_milestone == 1,
							);
							if (older_milestones.length > 0) {
								frappe.msgprint(
									__(
										"You must execute older milestone tasks in this project first. Please update Task: {0}",
										[older_milestones[0].name],
									),
								);
								has_error = true;
							}
						}

						// Validation 2: Same parent_task and project
						if (!has_error && frm.doc.parent_task) {
							let older_siblings = tasks.filter(
								(d) => d.parent_task === frm.doc.parent_task,
							);
							if (older_siblings.length > 0) {
								frappe.msgprint(
									__(
										"You must execute older tasks under the same parent task first. Please update Task: {0}",
										[older_siblings[0].name],
									),
								);
								has_error = true;
							}
						}

						if (has_error) {
							frappe.validated = false;
							reject();
						} else {
							resolve();
						}
					})
					.catch(() => resolve());
			});
		}
	},
});



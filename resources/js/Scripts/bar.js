import date_utils from "./date_utils";
import { $, createSVG, animateSVG } from "./svg_utils";

export default class Bar {
    constructor(gantt, task) {
        this.set_defaults(gantt, task);
        this.prepare();
        this.draw();
        this.bind();
    }

    set_defaults(gantt, task) {
        this.action_completed = false;
        this.gantt = gantt;
        this.task = task;
    }

    prepare() {
        this.prepare_values();
        this.prepare_helpers();
    }

    prepare_values() {
        this.invalid = this.task.invalid;
        this.height = this.gantt.options.bar_height;
        this.image_size = this.height - 5;
        this.compute_x();
        this.compute_y();
        this.compute_duration();
        this.corner_radius = this.gantt.options.bar_corner_radius;
        this.width = this.gantt.options.column_width * this.duration;
        this.progress_width =
            this.gantt.options.column_width *
            this.duration *
            (this.task.progress / 100) || 0;
        this.group = createSVG("g", {
            class:
                "bar-wrapper" +
                (this.task.custom_class ? " " + this.task.custom_class : "") +
                (this.task.important ? " important" : ""),
            "data-id": this.task.id,
        });
        this.bar_group = createSVG("g", {
            class: "bar-group",
            append_to: this.group,
        });
        this.handle_group = createSVG("g", {
            class: "handle-group",
            append_to: this.group,
        });
    }

    prepare_helpers() {
        SVGElement.prototype.getX = function () {
            return +this.getAttribute("x");
        };
        SVGElement.prototype.getY = function () {
            return +this.getAttribute("y");
        };
        SVGElement.prototype.getWidth = function () {
            return +this.getAttribute("width");
        };
        SVGElement.prototype.getHeight = function () {
            return +this.getAttribute("height");
        };
        SVGElement.prototype.getEndX = function () {
            return this.getX() + this.getWidth();
        };
    }

    prepare_expected_progress_values() {
        this.compute_expected_progress();
        this.expected_progress_width =
            this.gantt.options.column_width *
            this.duration *
            (this.expected_progress / 100) || 0;
    }

    draw() {
        this.draw_bar();
        this.draw_progress_bar();
        if (this.gantt.options.show_expected_progress) {
            this.prepare_expected_progress_values();
            this.draw_expected_progress_bar();
        }
        this.draw_label();
        this.draw_resize_handles();
        this.draw_toggle();

        if (this.task.thumbnail) {
            this.draw_thumbnail();
        }
    }

    draw_bar() {
        if (this.task.custom_class === "bar-milestone") {
            this.$bar = createSVG("polygon", {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                points: `${this.x + this.width / 2},${this.y} ${this.x + this.width},${this.y + this.height / 2} ${this.x + this.width / 2},${this.y + this.height} ${this.x},${this.y + this.height / 2}`,
                class:
                    "bar" +
                    (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
                        !this.task.important
                        ? " safari"
                        : ""),
                append_to: this.bar_group,
            });
        } else {
            this.$bar = createSVG("rect", {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                rx: this.corner_radius,
                ry: this.corner_radius,
                class:
                    "bar" +
                    (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
                        !this.task.important
                        ? " safari"
                        : ""),
                append_to: this.bar_group,
            });
        }

        animateSVG(this.$bar, "width", 0, this.width);

        if (this.invalid) {
            this.$bar.classList.add("bar-invalid");
        }
    }

    draw_expected_progress_bar() {
        if (this.invalid) return;
        this.$expected_bar_progress = createSVG("rect", {
            x: this.x,
            y: this.y,
            width: this.expected_progress_width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: "bar-expected-progress",
            append_to: this.bar_group,
        });

        animateSVG(
            this.$expected_bar_progress,
            "width",
            0,
            this.expected_progress_width
        );
    }

    draw_progress_bar() {
        if (this.invalid) return;
        this.$bar_progress = createSVG("rect", {
            x: this.x,
            y: this.y,
            width: this.progress_width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: "bar-progress",
            append_to: this.bar_group,
        });
        const x =
            (date_utils.diff(this.task._start, this.gantt.gantt_start, "hour") /
                this.gantt.options.step) *
            this.gantt.options.column_width;

        let $date_highlight = document.createElement("div");
        $date_highlight.id = `${this.task.id}-highlight`;
        $date_highlight.classList.add("date-highlight");
        $date_highlight.style.height = this.height * 0.8 + "px";
        $date_highlight.style.width = this.width + "px";
        $date_highlight.style.top = this.gantt.options.header_height - 25 + "px";
        $date_highlight.style.left = x + "px";
        this.$date_highlight = $date_highlight;
        this.gantt.$lower_header.prepend($date_highlight);

        animateSVG(this.$bar_progress, "width", 0, this.progress_width);
    }

    draw_label() {
        let x_coord = this.x + this.$bar.getWidth() / 2;

        if (this.task.thumbnail) {
            x_coord = this.x + this.image_size + 5;
        }

        let taskName = this.task.name;

        if (this.task.custom_class !== "bar-milestone") {
            let availableTextCharacters = this.$bar.getWidth() / 10;
            if (availableTextCharacters < taskName.length) {
                let overflow = taskName.length - availableTextCharacters;
                taskName = taskName.slice(0, -1 * overflow) + "...";
            }
        }

        createSVG("text", {
            x: x_coord,
            y: this.y + this.height / 2,
            innerHTML: taskName,
            class: "bar-label",
            append_to: this.bar_group,
        });
        // labels get BBox in the next tick
        requestAnimationFrame(() => this.update_label_position());
    }
    draw_thumbnail() {
        let x_offset = 10,
            y_offset = 2;
        let defs, clipPath;

        defs = createSVG("defs", {
            append_to: this.bar_group,
        });

        createSVG("rect", {
            id: "rect_" + this.task.id,
            x: this.x + x_offset,
            y: this.y + y_offset,
            width: this.image_size,
            height: this.image_size,
            rx: "15",
            class: "img_mask",
            append_to: defs,
        });

        clipPath = createSVG("clipPath", {
            id: "clip_" + this.task.id,
            append_to: defs,
        });

        createSVG("use", {
            href: "#rect_" + this.task.id,
            append_to: clipPath,
        });

        createSVG("image", {
            x: this.x + x_offset,
            y: this.y + y_offset,
            width: this.image_size,
            height: this.image_size,
            class: "bar-img",
            href: this.task.thumbnail,
            clipPath: "clip_" + this.task.id,
            append_to: this.bar_group,
        });
    }

    draw_resize_handles() {
        if (this.invalid || this.gantt.options.readonly) return;

        const bar = this.$bar;
        const handle_width = 8;
        if (!this.gantt.options.dates_readonly) {
            createSVG("rect", {
                x: bar.getX() + bar.getWidth() + handle_width - 4,
                y: bar.getY() + 1,
                width: handle_width,
                height: this.height - 2,
                rx: this.corner_radius,
                ry: this.corner_radius,
                class: "handle right",
                append_to: this.handle_group,
            });

            createSVG("rect", {
                x: bar.getX() - handle_width - 4,
                y: bar.getY() + 1,
                width: handle_width,
                height: this.height - 2,
                rx: this.corner_radius,
                ry: this.corner_radius,
                class: "handle left",
                append_to: this.handle_group,
            });
        }
        if (!this.gantt.options.progress_readonly) {
            const bar_progress = this.$bar_progress;
            this.$handle_progress = createSVG("circle", {
                cx: bar_progress.getEndX(),
                cy: bar_progress.getY() + bar_progress.getHeight() / 2,
                r: 5,
                class: "handle progress",
                append_to: this.handle_group,
            });
        }
    }

    draw_toggle() {
        if (!this.task.children?.length) return;

        const bar = this.$bar;
        const toggle_size = bar.getHeight() - 2;

        let toggle_btn_2 = createSVG("svg", {
            x: bar.getX() - toggle_size - 4,
            y: bar.getY() + bar.getHeight() / 2 - toggle_size / 2 + 1,
            width: toggle_size,
            height: toggle_size,
            viewBox: "0 0 20 20",
            class: this.task.collapsed ? "toggle left collapsed" : "toggle left",
            append_to: this.bar_group,
        });

        createSVG("rect", {
            x: 0,
            y: 0,
            width: toggle_size,
            height: toggle_size,
            rx: "100%",
            ry: "100%",
            fill: "gray",
            class: "toggle",
            append_to: toggle_btn_2,
        });

        createSVG("path", {
            d: "M8.60922 5.79677C8.71469 5.69143 8.85766 5.63226 9.00672 5.63226C9.15578 5.63226 9.29875 5.69143 9.40422 5.79677L15.0292 11.4218C15.1286 11.5284 15.1827 11.6694 15.1801 11.8152C15.1775 11.9609 15.1185 12.0999 15.0154 12.203C14.9124 12.306 14.7733 12.3651 14.6276 12.3676C14.4819 12.3702 14.3409 12.3161 14.2342 12.2168L9.00672 6.98927L3.77922 12.2168C3.67259 12.3161 3.53155 12.3702 3.38583 12.3676C3.2401 12.3651 3.10106 12.306 2.998 12.203C2.89494 12.0999 2.83591 11.9609 2.83334 11.8152C2.83077 11.6694 2.88486 11.5284 2.98422 11.4218L8.60922 5.79677Z",
            fill: "white",
            transform: this.task.collapsed ? "rotate(180) translate(2 2)" : "",
            class: "toggle",
            append_to: toggle_btn_2,
        });
    }

    bind() {
        if (this.invalid) return;
        this.setup_click_event();
    }

    setup_click_event() {
        let task_id = this.task.id;
        $.on(this.group, "mouseover", (e) => {
            this.gantt.trigger_event("hover", [this.task, e.screenX, e.screenY, e]);
        });

        let timeout;
        $.on(
            this.group,
            "mouseenter",
            (e) =>
            (timeout = setTimeout(() => {
                this.show_popup(e.offsetX || e.layerX);
                document.getElementById(`${task_id}-highlight`).style.display =
                    "block";
            }, 200))
        );

        $.on(this.group, "mouseleave", () => {
            clearTimeout(timeout);
            this.gantt.popup?.hide?.();
            document.getElementById(`${task_id}-highlight`).style.display = "none";
        });

        $.on(this.group, "click", (e) => {
            if (e.target.classList.contains("toggle"))
                this.gantt.trigger_event("toggle", [this.task]);
            else this.gantt.trigger_event("click", [this.task]);
        });

        $.on(this.group, "dblclick", (e) => {
            if (this.action_completed) {
                // just finished a move action, wait for a few seconds
                return;
            }
            this.group.classList.remove("active");
            if (this.gantt.popup) this.gantt.popup.parent.classList.remove("hidden");

            this.gantt.trigger_event("double_click", [this.task]);
        });
    }

    show_popup(x) {
        if (this.gantt.bar_being_dragged) return;

        const start_date = date_utils.format(
            this.task._start,
            "MMM D",
            this.gantt.options.language
        );
        const end_date = date_utils.format(
            date_utils.add(this.task._end, -1, "second"),
            "MMM D",
            this.gantt.options.language
        );
        const subtitle = `${start_date} -  ${end_date}<br/>Progress: ${this.task.progress}`;

        this.gantt.show_popup({
            x,
            target_element: this.$bar,
            title: this.task.name,
            subtitle: subtitle,
            task: this.task,
        });
    }

    update_bar_position({ x = null, width = null }) {
        const bar = this.$bar;
        if (x) {
            // get all x values of parent task
            const xs = this.task.dependencies.map((dep) => {
                return this.gantt.get_bar(dep).$bar.getX();
            });
            // child task must not go before parent
            const valid_x = xs.reduce((_, curr) => {
                return x >= curr;
            }, x);
            if (!valid_x) {
                width = null;
                return;
            }
            this.update_attr(bar, "x", x);
            this.$date_highlight.style.left = x + "px";
        }
        if (width) {
            this.update_attr(bar, "width", width);
            this.$date_highlight.style.width = width + "px";
        }
        this.update_label_position();
        this.update_handle_position();
        if (this.gantt.options.show_expected_progress) {
            this.date_changed();
            this.compute_duration();
            this.update_expected_progressbar_position();
        }
        this.update_progressbar_position();
        this.update_arrow_position();
    }

    update_label_position_on_horizontal_scroll({ x, sx }) {
        const container = document.querySelector(".gantt-container");
        const label = this.group.querySelector(".bar-label");
        const img = this.group.querySelector(".bar-img") || "";
        const img_mask = this.bar_group.querySelector(".img_mask") || "";

        let barWidthLimit = this.$bar.getX() + this.$bar.getWidth();
        let newLabelX = label.getX() + x;
        let newImgX = (img && img.getX() + x) || 0;
        let imgWidth = (img && img.getBBox().width + 7) || 7;
        let labelEndX = newLabelX + label.getBBox().width + 7;
        let viewportCentral = sx + container.clientWidth / 2;

        if (label.classList.contains("big")) return;

        if (labelEndX < barWidthLimit && x > 0 && labelEndX < viewportCentral) {
            label.setAttribute("x", newLabelX);
            if (img) {
                img.setAttribute("x", newImgX);
                img_mask.setAttribute("x", newImgX);
            }
        } else if (
            newLabelX - imgWidth > this.$bar.getX() &&
            x < 0 &&
            labelEndX > viewportCentral
        ) {
            label.setAttribute("x", newLabelX);
            if (img) {
                img.setAttribute("x", newImgX);
                img_mask.setAttribute("x", newImgX);
            }
        }
    }

    date_changed() {
        let changed = false;
        const { new_start_date, new_end_date } = this.compute_start_end_date();

        if (Number(this.task._start) !== Number(new_start_date)) {
            changed = true;
            this.task._start = new_start_date;
        }

        if (Number(this.task._end) !== Number(new_end_date)) {
            changed = true;
            this.task._end = new_end_date;
        }

        if (!changed) return;

        this.gantt.trigger_event("date_change", [
            this.task,
            new_start_date,
            date_utils.add(new_end_date, -1, "second"),
        ]);
    }

    progress_changed() {
        const new_progress = this.compute_progress();
        this.task.progress = new_progress;
        this.gantt.trigger_event("progress_change", [this.task, new_progress]);
    }

    set_action_completed() {
        this.action_completed = true;
        setTimeout(() => (this.action_completed = false), 1000);
    }

    compute_start_end_date() {
        const bar = this.$bar;
        const x_in_units = bar.getX() / this.gantt.options.column_width;
        let new_start_date = date_utils.add(
            this.gantt.gantt_start,
            x_in_units * this.gantt.options.step,
            "hour"
        );
        const start_offset =
            this.gantt.gantt_start.getTimezoneOffset() -
            new_start_date.getTimezoneOffset();
        if (start_offset) {
            new_start_date = date_utils.add(new_start_date, start_offset, "minute");
        }

        const width_in_units = bar.getWidth() / this.gantt.options.column_width;
        const new_end_date = date_utils.add(
            new_start_date,
            width_in_units * this.gantt.options.step,
            "hour"
        );

        return { new_start_date, new_end_date };
    }

    compute_progress() {
        const progress =
            (this.$bar_progress.getWidth() / this.$bar.getWidth()) * 100;
        return parseInt(progress, 10);
    }

    compute_expected_progress() {
        this.expected_progress =
            date_utils.diff(date_utils.today(), this.task._start, "hour") /
            this.gantt.options.step;
        this.expected_progress =
            ((this.expected_progress < this.duration
                ? this.expected_progress
                : this.duration) *
                100) /
            this.duration;
    }

    compute_x() {
        const { step, column_width } = this.gantt.options;
        const task_start = this.task._start;
        const gantt_start = this.gantt.gantt_start;

        const diff = date_utils.diff(task_start, gantt_start, "hour");
        let x = (diff / step) * column_width;

        /* Since the column width is based on 30,
            we count the month-difference, multiply it by 30 for a "pseudo-month"
            and then add the days in the month, making sure the number does not exceed 29
            so it is within the column */
        if (this.gantt.view_is("Month")) {
            const diffDaysBasedOn30DayMonths =
                date_utils.diff(task_start, gantt_start, "month") * 30;
            const dayInMonth = Math.min(29, date_utils.format(task_start, "DD"));
            const diff = diffDaysBasedOn30DayMonths + dayInMonth;

            x = (diff * column_width) / 30;
        }
        this.x = x;
    }

    compute_y() {
        this.y =
            this.gantt.options.header_height +
            this.gantt.options.padding +
            this.task._index * (this.height + this.gantt.options.padding);
    }

    compute_duration() {
        this.duration =
            date_utils.diff(this.task._end, this.task._start, "hour") /
            this.gantt.options.step;
    }

    get_snap_position(dx) {
        let odx = dx,
            rem,
            position;

        if (this.gantt.view_is("Week")) {
            rem = dx % (this.gantt.options.column_width / 7);
            position =
                odx -
                rem +
                (rem < this.gantt.options.column_width / 14
                    ? 0
                    : this.gantt.options.column_width / 7);
        } else if (this.gantt.view_is("Month")) {
            rem = dx % (this.gantt.options.column_width / 30);
            position =
                odx -
                rem +
                (rem < this.gantt.options.column_width / 60
                    ? 0
                    : this.gantt.options.column_width / 30);
        } else {
            rem = dx % this.gantt.options.column_width;
            position =
                odx -
                rem +
                (rem < this.gantt.options.column_width / 2
                    ? 0
                    : this.gantt.options.column_width);
        }
        return position;
    }

    update_attr(element, attr, value) {
        value = +value;
        if (!isNaN(value)) {
            element.setAttribute(attr, value);
        }
        return element;
    }

    update_expected_progressbar_position() {
        if (this.invalid) return;
        this.$expected_bar_progress.setAttribute("x", this.$bar.getX());
        this.compute_expected_progress();
        this.$expected_bar_progress.setAttribute(
            "width",
            this.gantt.options.column_width *
            this.duration *
            (this.expected_progress / 100) || 0
        );
    }

    update_progressbar_position() {
        if (this.invalid || this.gantt.options.readonly) return;
        this.$bar_progress.setAttribute("x", this.$bar.getX());
        this.$bar_progress.setAttribute(
            "width",
            this.$bar.getWidth() * (this.task.progress / 100)
        );
    }

    update_label_position() {
        const img_mask = this.bar_group.querySelector(".img_mask") || "";
        const bar = this.$bar,
            label = this.group.querySelector(".bar-label"),
            img = this.group.querySelector(".bar-img");

        let padding = 5;
        let x_offset_label_img = this.image_size + 10;
        const labelWidth = label.getBBox().width;
        const barWidth = bar.getWidth();
        if (labelWidth > barWidth) {
            label.classList.add("big");
            if (img) {
                img.setAttribute("x", bar.getX() + bar.getWidth() + padding);
                img_mask.setAttribute("x", bar.getX() + bar.getWidth() + padding);
                label.setAttribute(
                    "x",
                    bar.getX() + bar.getWidth() + x_offset_label_img
                );
            } else {
                label.setAttribute("x", bar.getX() + bar.getWidth() + padding);
            }
        } else {
            label.classList.remove("big");
            if (img) {
                img.setAttribute("x", bar.getX() + padding);
                img_mask.setAttribute("x", bar.getX() + padding);
                label.setAttribute("x", bar.getX() + barWidth / 2 + x_offset_label_img);
            } else {
                label.setAttribute("x", bar.getX() + barWidth / 2 - labelWidth / 2);
            }
        }
    }

    update_handle_position() {
        if (this.invalid || this.gantt.options.readonly) return;
        const bar = this.$bar;
        this.handle_group
            .querySelector(".handle.left")
            .setAttribute("x", bar.getX() - 12);
        this.handle_group
            .querySelector(".handle.right")
            .setAttribute("x", bar.getEndX() + 4);
        const handle = this.group.querySelector(".handle.progress");
        handle && handle.setAttribute("cx", this.$bar_progress.getEndX());
    }

    update_arrow_position() {
        this.arrows = this.arrows || [];
        for (let arrow of this.arrows) {
            arrow.update();
        }
    }
}

function isFunction(functionToCheck) {
    let getType = {};
    return (
        functionToCheck &&
        getType.toString.call(functionToCheck) === "[object Function]"
    );
}

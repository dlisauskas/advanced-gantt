export default class Popup {
    constructor(parent, custom_html, svg) {
        this.parent = parent;
        this.custom_html = custom_html;
        this.svg = svg;
        this.make();
    }

    make() {
        this.parent.innerHTML = `
              <div class="title"></div>
              <div class="subtitle"></div>
              <div class="pointer"></div>
          `;

        this.hide();

        this.title = this.parent.querySelector(".title");
        this.subtitle = this.parent.querySelector(".subtitle");
        this.pointer = this.parent.querySelector(".pointer");
    }

    show(options) {
        if (!options.target_element) {
            throw new Error("target_element is required to show popup");
        }
        const target_element = options.target_element;

        if (this.custom_html) {
            let html = this.custom_html(options.task);
            html += '<div class="pointer"></div>';
            this.parent.innerHTML = html;
            this.pointer = this.parent.querySelector(".pointer");
        } else {
            // set data
            this.title.innerHTML = options.title;
            this.subtitle.innerHTML = options.subtitle;
        }

        // set position
        let position_meta;
        if (target_element instanceof HTMLElement) {
            position_meta = target_element.getBoundingClientRect();
        } else if (target_element instanceof SVGElement) {
            position_meta = options.target_element.getBBox();
        }

        const chartHeight = this.svg.getBoundingClientRect().height;

        if (position_meta.y + position_meta.height + 100 > chartHeight) {
            this.parent.style.top = position_meta.y - this.parent.clientHeight - 10 + "px";
            this.pointer.style.bottom = "-10px";
            this.pointer.style.top = "auto";
            this.pointer.style.transform = "rotate(180deg)";
        } else {
            this.parent.style.top = position_meta.y + position_meta.height + 10 + "px";
            this.pointer.style.top = "-10px";
            this.pointer.style.bottom = "auto";
            this.pointer.style.transform = "rotate(0deg)";
        }

        this.parent.style.left = options.x - this.parent.clientWidth / 2 + "px";

        this.pointer.style.left = this.parent.clientWidth / 2 + "px";

        // show
        this.parent.style.opacity = 1;
    }

    hide() {
        this.parent.style.opacity = 0;
        this.parent.style.left = 0;
    }
}

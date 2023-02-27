"use strict";
/// <reference path='../../node_modules/@types/jquery/index.d.ts'/>
class Joy {
    constructor(selector) {
        this.clicked = false;
        this.pos = { X: 0, Y: 0 };
        this.parent = $(selector);
        this.container = $('<div></div>');
        this.container.css('border', '1px black solid');
        this.container.css('margin', 'auto');
        this.container_size = this.parent.height();
        this.container.width(this.container_size);
        this.container.height(this.container_size);
        this.parent.append(this.container);
        this.joy = $('<div></div>');
        this.joy.css('border-radius', '50%');
        this.joy.css('background', 'green');
        this.joy.css('position', 'relative');
        this.joy_default_pos = this.container_size * 0.05;
        this.joy.css('top', this.joy_default_pos);
        this.joy.css('left', this.joy_default_pos);
        this.joy_default_size = this.container_size * 0.9;
        this.joy.height(this.joy_default_size);
        this.joy.width(this.joy_default_size);
        this.joy_center = this.container_size * 0.45;
        this.container.append(this.joy);
        this.Events(selector);
    }
    Events(selector) {
        $(document).on('mousedown', `${selector} > div`, this.MouseDown.bind(this));
        $(document).on('touchstart', `${selector} > div`, this.TouchDown.bind(this));
        $(document).on('mousemove', `${selector} > div`, this.MouseMove.bind(this));
        $(document).on('touchmove', `${selector} > div`, this.TouchMove.bind(this));
        $(document).on('mouseup', `${selector} > div`, this.MouseUp.bind(this));
        $(document).on('touchend', `${selector} > div`, this.TouchUp.bind(this));
        $(document).on('touchcancel', `${selector} > div`, this.TouchUp.bind(this));
    }
    move(x, y) {
        if (x > this.container_size) {
            x = this.container_size;
        }
        else if (x < 0) {
            x = 0;
        }
        if (y > this.container_size) {
            y = this.container_size;
        }
        else if (y < 0) {
            y = 0;
        }
        this.joy.css('left', x - this.joy_center);
        this.joy.css('top', y - this.joy_center);
        this.pos.X = 2 * (x / this.container_size) - 1;
        this.pos.Y = -2 * (y / this.container_size) + 1;
    }
    MouseDown(e) {
        this.clicked = true;
        this.move(e.pageX - this.container.get(0).offsetLeft, e.pageY - this.container.get(0).offsetTop);
    }
    MouseMove(e) {
        if (this.clicked) {
            this.move(e.pageX - this.container.get(0).offsetLeft, e.pageY - this.container.get(0).offsetTop);
        }
    }
    MouseUp(e) {
        this.clicked = false;
        this.joy.css('left', this.joy_default_pos);
        this.joy.css('top', this.joy_default_pos);
        this.pos.X = 0;
        this.pos.Y = 0;
    }
    TouchDown(e) {
        this.clicked = true;
        this.move(e.targetTouches[0].pageX - this.container.get(0).offsetLeft, e.targetTouches[0].pageY - this.container.get(0).offsetTop);
    }
    TouchMove(e) {
        if (this.clicked) {
            this.move(e.targetTouches[0].pageX - this.container.get(0).offsetLeft, e.targetTouches[0].pageY - this.container.get(0).offsetTop);
        }
    }
    TouchUp(e) {
        this.clicked = false;
        this.joy.css('left', this.joy_default_pos);
        this.joy.css('top', this.joy_default_pos);
        this.pos.X = 0;
        this.pos.Y = 0;
    }
    Resize() {
        this.container_size = this.parent.height();
        this.container.width(this.container_size);
        this.container.height(this.container_size);
        this.joy_default_pos = this.container_size * 0.05;
        this.joy_default_size = this.container_size * 0.9;
        this.joy_center = this.container_size * 0.45;
        this.joy.width(this.joy_default_size);
        this.joy.height(this.joy_default_size);
        this.joy.css('left', this.joy_default_pos);
        this.joy.css('top', this.joy_default_pos);
    }
    GetPos(num_of_digits = 1) {
        return { X: Math.round(this.pos.X * num_of_digits), Y: Math.round(this.pos.Y * num_of_digits) };
    }
}

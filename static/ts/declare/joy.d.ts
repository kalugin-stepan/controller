/// <reference types="jquery" />
interface Pos {
    X: number;
    Y: number;
}
declare class Joy {
    readonly parent: JQuery;
    readonly container: JQuery<HTMLDivElement>;
    readonly joy: JQuery<HTMLDivElement>;
    private container_size;
    private joy_center;
    private joy_default_pos;
    private joy_default_size;
    clicked: boolean;
    private pos;
    constructor(selector: string);
    private Events;
    private click;
    private MouseDown;
    private MouseMove;
    private MouseUp;
    private TouchDown;
    private TouchMove;
    private TouchUp;
    Resize(): void;
    GetPos(): Pos;
}

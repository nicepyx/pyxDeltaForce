
const { ccclass, property } = cc._decorator;

/**
 * 虚拟摇杆组件 
 *
 * 作用：
 * 1. 监听挂载节点上的触摸事件；
 * 2. 在按下位置显示摇杆底座；
 * 3. 根据手指拖动距离更新摇杆杆头位置；
 * 4. 对外提供标准化后的移动方向 `dir` 和力度 `force` 
 *
 * 坐标约定：
 * - 触摸点先从屏幕坐标转换到当前节点本地坐标；
 * - `bg` 的位置表示摇杆中心；
 * - `stick` 的位置相对于 `bg`，因此更新时只需要传入偏移量 
 */
@ccclass
export default class Joystick extends cc.Component {

    /** 摇杆底座 */
    @property(cc.Node)
    bg: cc.Node = null;
    /** 摇杆杆头 */
    @property(cc.Node)
    stick: cc.Node = null;
    /** 方向指示器 */
    @property(cc.Node)
    dirIndicator: cc.Node = null;


    /** 摇杆最大有效半径 */
    public radius: number = 80;
    /** 当前输出方向 */
    public dir: cc.Vec2 = cc.v2(0, 0);
    /** 是否在触摸 */
    public isTouching: boolean = false;

    /** 当前触摸 ID */
    private touchId: number = -1;
    /** 本次触摸开始的坐标 */
    private startPos: cc.Vec2 = cc.v2(0, 0);

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);

        // 用底座宽度的一半作为半径，保证可视范围和逻辑范围一致 
        this.radius = this.bg.width / 2;

        // 初始隐藏摇杆，等待玩家触摸时再显示 
        this.hideJoystick();
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchStart(event: cc.Event.EventTouch) {
        // 避免多指抢占
        if (this.touchId !== -1) return;
        this.touchId = event.getID();
        this.isTouching = true;

        const worldPos = event.getLocation();
        const localPos = this.node.convertToNodeSpaceAR(worldPos);

        // 记录起点
        this.startPos = localPos;

        // 底座显示，并刷新一次摇杆状态 
        this.showJoystick(localPos);
        this.updateJoystick(localPos);
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        // 避免多指抢占
        if (event.getID() !== this.touchId) return;

        const worldPos = event.getLocation();
        const localPos = this.node.convertToNodeSpaceAR(worldPos);

        // 按最新触摸点更新杆头位置、方向和指示器朝向 
        this.updateJoystick(localPos);
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        // 避免多指抢占
        if (event.getID() !== this.touchId) return;

        // 清空控制状态
        this.touchId = -1;
        this.isTouching = false;
        this.dir = cc.v2(0, 0);

        this.hideJoystick();
    }

    private showJoystick(touchPos: cc.Vec2) {
        this.bg.active = true;

        this.bg.setPosition(touchPos);

        this.stick.setPosition(0, 0);

        this.dirIndicator.active = true;
        this.dirIndicator.angle = 0;
        this.dirIndicator.setPosition(0, 0);
    }

    private updateJoystick(touchPos: cc.Vec2) {
        // 偏移量 = 当前触摸点 - 起始触摸点 
        // 这个向量既能表示拖动方向，也能表示当前力度大小 
        const offset = touchPos.sub(this.startPos);
        const len = offset.mag();
        let finalDir = cc.v2(0, 0);

        // 手指仍在有效半径内时
        if (len <= this.radius) {
            this.stick.setPosition(offset);
            finalDir = len > 0 ? offset.normalize() : cc.v2(0, 0);
        }
        else {
            // 超出半径时
            const clampOffset = offset.normalize().mul(this.radius);
            this.stick.setPosition(clampOffset);
            finalDir = clampOffset.normalize();
        }

        this.dir = finalDir;
        this.updateDirIndicator();
    }

    private updateDirIndicator() {
        // 没有方向时不更新，避免抬手后残留无意义旋转 
        if (this.dir.magSqr() <= 0) return;

        // atan2 得到以 X 轴正方向为 0 度的角度 
        const angle = Math.atan2(this.dir.y, this.dir.x) * 180 / Math.PI;

        // 美术资源朝上，因此这里额外减去 90 度进行对齐 
        this.dirIndicator.angle = angle - 90;
    }

    private hideJoystick() {
        // 隐藏底座
        this.bg.active = false;

        // 复位杆头，保证下次显示时从中心开始
        this.stick.setPosition(0, 0);

        this.dirIndicator.active = false;
        this.dirIndicator.angle = 0;
        this.dirIndicator.setPosition(0, 0);
    }

    public getMoveDir(): cc.Vec2 {
        // 返回标准化后的方向，便于角色移动、朝向控制等逻辑直接使用 
        return this.dir;
    }

    public getForce(): number {
        // 用当前杆头位移长度除以最大半径，得到 0~1 的力度值 
        // 可用于区分轻推 / 满推，例如走路和奔跑 
        return this.stick.position.mag() / this.radius;
    }
}

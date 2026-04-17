import Joystick from "../input/Joystick";

const { ccclass, property } = cc._decorator;

/**
 * 主角移动控制器。
 *
 * 作用：
 * 1. 从虚拟摇杆读取移动方向；
 * 2. 按固定速度驱动当前节点在平面内移动。
 *
 * 当前实现只使用方向，不使用摇杆力度，
 * 因此角色会以恒定速度移动。
 */
@ccclass
export default class RoleController extends cc.Component {

    /** 提供输入方向的虚拟摇杆组件。 */
    @property(Joystick)
    joystick: Joystick = null;

    /** 角色移动速度，按每秒位移距离计算。 */
    public moveSpeed: number = 500;


    update(dt: number) {
        // 从摇杆读取标准化方向后，按速度与帧时间推进角色位置。
        const dir = this.joystick.getMoveDir();
        this.node.x += dir.x * this.moveSpeed * dt;
        this.node.y += dir.y * this.moveSpeed * dt;
    }

}

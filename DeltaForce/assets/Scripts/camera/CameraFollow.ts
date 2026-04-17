
const { ccclass, property } = cc._decorator;

/**
 * 相机跟随组件。
 *
 * 作用：
 * 1. 在 `lateUpdate` 阶段读取目标位置；
 * 2. 使用线性插值让当前节点平滑跟随目标移动。
 *
 * 通常这个脚本会挂在相机节点上，
 * 目标则是玩家或队长节点。
 */
@ccclass
export default class CameraFollow extends cc.Component {

    /** 相机需要跟随的目标节点。 */
    @property(cc.Node)
    public target: cc.Node = null;

    /** 跟随平滑速度，越大越接近“紧跟”，越小越拖尾。 */
    @property
    public smoothSpeed: number = 8;

    lateUpdate(dt: number) {
        // 没有目标时不移动相机。
        if (!this.target) return;

        // 取相机当前位置与目标位置，按插值比例平滑过渡。
        const curPos = this.node.position;
        const targetPos = this.target.position;

        // 限制比例不超过 1，避免低帧率下插值越界。
        const lerpRatio = Math.min(1, dt * this.smoothSpeed);
        const nextPos = curPos.lerp(targetPos, lerpRatio);

        this.node.setPosition(nextPos.x, nextPos.y);

    }
}

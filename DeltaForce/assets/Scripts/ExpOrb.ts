const { ccclass, property } = cc._decorator;

/**
 * 经验球组件。
 *
 * 作用：
 * 1. 记录单个经验球可提供的经验值；
 * 2. 当主角进入吸附范围后，自动朝目标飞行；
 * 3. 与目标足够接近时触发拾取回调，并销毁自己。
 *
 * 当前实现是“范围触发后匀速吸附”的模式，
 * 不会主动搜寻目标，目标引用需要由外部在生成时赋值。
 */
@ccclass
export default class ExpOrb extends cc.Component {

    /** 被拾取时增加的经验值。 */
    public expValue: number = 1;
    /** 进入该距离后开始朝目标飞行。 */
    public absorbRange: number = 300;
    /** 经验球吸附飞行速度。 */
    public flySpeed: number = 1000;
    /** 当前拾取目标，通常是玩家或队长节点。 */
    public target: cc.Node = null;
    /** 拾取成功后的回调，由外部用于累加经验。 */
    public onPick: (value: number) => void = null;

    update(dt: number) {
        // 没有可用目标时，经验球保持静止，不主动销毁。
        if (!this.target || !this.target.isValid) return;

        // 计算经验球到目标的方向和距离。
        const dir = this.target.position.sub(this.node.position);
        const dis = dir.mag();

        // 进入拾取半径后立即判定拾取成功。
        if (dis <= 20) {
            this.onPick && this.onPick(this.expValue);
            this.node.destroy();
            return;
        }

        // 目标还太远时不进行吸附，让经验球先停留在地面。
        if (dis > this.absorbRange) return;

        // 吸附后按固定速度向目标推进。
        const moveDis = this.flySpeed * dt;
        const moveDir = dir.normalize();

        this.node.x += moveDir.x * moveDis;
        this.node.y += moveDir.y * moveDis;
    }
}

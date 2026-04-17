
const { ccclass, property } = cc._decorator;

/**
 * 敌人基础组件。
 *
 * 作用：
 * 1. 保存敌人的基础战斗属性，例如生命值、移动速度、接触伤害；
 * 2. 每帧朝目标节点移动；
 * 3. 接收外部伤害并处理死亡；
 * 4. 在死亡时通过回调通知管理器，把自己从敌人列表中移除。
 *
 * 当前实现是一个非常基础的“直线追踪敌人”：
 * - 目标通常由 `EnemyManager` 在生成时赋值；
 * - 敌人不会寻路，只会朝目标当前位置做直线移动；
 * - 当生命值降到 0 或以下时，会先触发 `onDie`，再销毁节点。
 */
@ccclass
export default class EnemyBase extends cc.Component {

    /** 最大生命值。敌人生成后会用它初始化当前生命值。 */
    public maxHp: number = 5;
    /** 移动速度，按每秒位移距离计算。 */
    public moveSpeed: number = 100;
    /** 与目标发生接触时理论上造成的伤害值。当前脚本里仅保存该数据，未直接使用。 */
    public touchDamage: number = 1;

    /** 当前生命值。 */
    public hp: number = 0;
    /** 当前追踪目标，通常是玩家或队伍领队节点。 */
    public target: cc.Node = null;
    /** 死亡回调，供外部管理器在敌人销毁前做列表清理等处理。 */
    public onDie: (enemy: EnemyBase) => void = null;

    public collideDamage: number = 1;
    public attackInterval: number = 1;
    public hitRadius: number = 40;

    private attackTimer: number = 0;

    onLoad() {
        // 敌人初始化时把当前生命值重置到满血状态。
        this.hp = this.maxHp;
    }

    update(dt: number) {
        // 没有目标或目标节点已失效时，不执行追击逻辑。
        if (!this.target || !this.target.isValid) return;

        // 当前实现默认敌人与目标处于同一坐标系，可直接比较 position。
        const curPos = this.node.position;
        const targetPos = this.target.position;

        // 计算从自己指向目标的方向向量。
        const dir = targetPos.sub(curPos);

        // 距离极小时不再移动，避免在目标点附近因浮点误差产生微小抖动。
        if (dir.magSqr() <= 0.01) return;

        // 归一化后只保留方向，再按速度和 dt 推进，实现稳定的逐帧移动。
        const moveDir = dir.normalize();
        this.node.x += moveDir.x * this.moveSpeed * dt;
        this.node.y += moveDir.y * this.moveSpeed * dt;
    }

    public takeDamage(value: number) {
        // 直接扣减生命值。当前版本不做护甲、减伤、无敌帧等额外处理。
        this.hp -= value;

        // 生命值耗尽后立即进入死亡流程。
        if (this.hp <= 0) {
            this.die();
        }
    }

    public die() {
        // 先通知外部，再销毁自己。
        // 这样 EnemyManager 等管理者有机会把该敌人从缓存列表中移除。
        this.onDie && this.onDie(this);
        this.node.destroy();
    }
}

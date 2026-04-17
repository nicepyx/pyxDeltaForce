const { ccclass, property } = cc._decorator;

/**
 * 主角生命组件。
 *
 * 作用：
 * 1. 维护当前生命值和最大生命值；
 * 2. 处理受伤与治疗；
 * 3. 通过回调把生命变化和死亡事件通知外部系统。
 *
 * 当前实现不包含护盾、无敌、持续伤害等扩展机制，
 * 是一个最基础的血量容器。
 */
@ccclass
export default class RoleHealth extends cc.Component {

    /** 最大生命值。 */
    public maxHp: number = 10;
    /** 当前生命值。 */
    public curHp: number = 0;
    /** 血量发生变化时的回调。 */
    public onHpChange: (curHp: number, maxHp: number) => void = null;
    /** 血量归零时的死亡回调。 */
    public onDie: () => void = null;

    onLoad() {
        // 启动时把当前血量重置为满血。
        this.curHp = this.maxHp;
    }

    public takeDamage(value: number) {
        // 已经死亡时不再继续扣血。
        if (this.curHp <= 0) return;
        this.curHp -= value;

        // 血量下限保护到 0，避免出现负值显示。
        if (this.curHp < 0) {
            this.curHp = 0;
        }

        // 每次变化后都通知 UI 或战斗系统刷新。
        this.onHpChange && this.onHpChange(this.curHp, this.maxHp);

        // 生命值归零时触发死亡事件。
        if (this.curHp <= 0) {
            this.onDie && this.onDie();
        }
    }

    public heal(value: number) {
        // 当前版本里死亡后不能被普通治疗拉起。
        if (this.curHp <= 0) return;
        this.curHp += value;

        // 血量上限保护到最大生命值。
        if (this.curHp > this.maxHp) {
            this.curHp = this.maxHp;
        }
        this.onHpChange && this.onHpChange(this.curHp, this.maxHp);
    }
}

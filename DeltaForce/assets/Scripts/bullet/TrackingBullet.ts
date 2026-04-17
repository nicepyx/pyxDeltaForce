import EnemyBase from "../enemy/EnemyBase";
import BulletBase, { BulletInitData } from "./BulletBase";

const { ccclass } = cc._decorator;

interface TrackingBulletInitData extends BulletInitData {
    target?: EnemyBase;
    hitRadius?: number;
}

/**
 * 追踪子弹
 *
 * 行为规则：
 * 1. 目标存活时，子弹持续追踪目标当前位置；
 * 2. 如果目标在子弹命中前已经死亡/失效，则记录目标最后一次有效位置；
 * 3. 子弹会继续朝这个最后位置飞行；
 * 4. 飞到这个位置后，若目标已经失效，则直接销毁自己，不再造成伤害。
 */
@ccclass
export default class TrackingBullet extends BulletBase {

    /** 当前追踪的目标。 */
    public target: EnemyBase = null;
    /** 命中判定半径。 */
    public hitRadius: number = 20;

    /** 目标最后一次有效时的位置缓存。 */
    private lastTargetPos: cc.Vec2 = null;

    protected onInit(data: TrackingBulletInitData) {
        // 兼容统一初始化入口；即使外部仍直接赋值 target，也不影响下面 update 的工作。
        if (data.target) {
            this.target = data.target;
        }
        if (data.hitRadius != null) {
            this.hitRadius = data.hitRadius;
        }

        // 初始化阶段先缓存一次目标位置，避免目标过快死亡时没有可飞行的终点。
        if (this.isTargetValid()) {
            this.lastTargetPos = cc.v2(this.target.node.position);
        }
    }

    protected onUpdateBullet(dt: number) {
        const curPos = cc.v2(this.node.position);
        let destination: cc.Vec2 = null;
        let canDealDamage = false;

        // 目标仍有效时，持续追踪其最新位置，并刷新“最后位置”缓存。
        if (this.isTargetValid()) {
            destination = cc.v2(this.target.node.position);
            this.lastTargetPos = destination.clone();
            canDealDamage = true;
        }
        else if (this.lastTargetPos) {
            // 目标已失效时，继续飞向目标最后一次有效的位置。
            destination = this.lastTargetPos.clone();
        }
        else {
            // 连最后位置都没有时，子弹已经失去意义。
            this.Finish();
            return;
        }

        const dir = destination.sub(curPos);
        const dis = dir.mag();

        // 足够接近目标点时结束本发子弹。
        // 只有目标当前仍然有效时才真正造成伤害。
        if (dis <= this.hitRadius) {
            if (canDealDamage) {
                this.ApplyDamage(this.target);
            }
            this.Finish();
            return;
        }

        const moveDis = this.moveSpeed * dt;

        // 本帧足以飞到终点时，直接贴到终点并结束。
        if (moveDis >= dis) {
            this.node.setPosition(destination);
            if (canDealDamage) {
                this.ApplyDamage(this.target);
            }
            this.Finish();
            return;
        }

        // 正常情况下继续朝当前目标点推进。
        const moveDir = dir.normalize();
        this.node.x += moveDir.x * moveDis;
        this.node.y += moveDir.y * moveDis;
    }

    private isTargetValid(): boolean {
        return !!(this.target && this.target.node && this.target.node.isValid);
    }
}

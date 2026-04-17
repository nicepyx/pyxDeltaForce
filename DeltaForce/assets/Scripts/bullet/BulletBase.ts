import EnemyBase from "../enemy/EnemyBase";
import EnemyManager from "../enemy/EnemyManager";

const { ccclass, property } = cc._decorator;

export interface BulletInitData {
    owner?: cc.Node;
    enemyManager?: EnemyManager;
    damage?: number;
    moveSpeed?: number;
}

@ccclass
export default class BulletBase extends cc.Component {

    public damage: number = 1;
    public moveSpeed: number = 500;
    public maxLifeTime: number = 5;

    protected owner: cc.Node = null;
    protected enemyManger: EnemyManager = null;
    protected lifeTimer: number = 0;
    protected isFinished: boolean = false;
    protected hitTargets: EnemyBase[] = [];

    public Init<T extends BulletInitData>(data: T) {
        this.owner = data.owner;
        this.enemyManger = data.enemyManager;
        this.damage = data.damage ?? this.damage;
        this.moveSpeed = data.moveSpeed ?? this.moveSpeed;
        this.lifeTimer = 0;
        this.isFinished = false;
        this.hitTargets.length = 0;

        this.onInit(data);
    }

    update(dt: number) {
        if (this.isFinished) return;

        this.lifeTimer += dt;
        if (this.lifeTimer >= this.maxLifeTime) {
            this.onLifeEnd();
            return;
        }
        this.onUpdateBullet(dt);
    }

    protected onInit<T extends BulletInitData>(data: T) {

    }

    protected onUpdateBullet(dt: number) {


    }

    protected onLifeEnd() {
        this.Finish();
    }


    protected ApplyDamage(target: EnemyBase) {
        if (!target || !target.node || !target.node.isValid) return;
        target.takeDamage(this.damage);
    }

    protected HasHit(target: EnemyBase): boolean {
        return this.hitTargets.includes(target);
    }

    protected MarkHit(target: EnemyBase) {
        if (!this.HasHit(target)) {
            this.hitTargets.push(target);
        }
    }

    protected Finish() {
        if (this.isFinished) return;
        this.isFinished = true;
        this.node.destroy();
    }

}

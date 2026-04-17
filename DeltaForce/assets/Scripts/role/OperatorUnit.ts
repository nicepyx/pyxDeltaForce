import TrackingBullet from "../bullet/TrackingBullet";
import EnemyBase from "../enemy/EnemyBase";
import EnemyManager from "../enemy/EnemyManager";

const { ccclass, property } = cc._decorator;

/**
 * 单个干员组件。
 *
 * 作用：
 * 1. 记录干员的索引和基础攻击属性；
 * 2. 周期性搜索最近敌人；
 * 3. 命中条件满足时实例化子弹并指定目标；
 * 4. 持有战斗运行所需的引用，例如敌人管理器和子弹根节点。
 */
@ccclass
export default class OperatorUnit extends cc.Component {

    /** 干员在小队中的序号，通常由小队控制器统一分配。 */
    public index: number = 0;

    /** 发射子弹使用的预制体。 */
    @property(cc.Prefab)
    public bulletPrefab: cc.Prefab = null;
    /** 子弹统一挂载的父节点。 */
    @property(cc.Node)
    public bulletRoot: cc.Node = null;

    /** 攻击间隔，单位秒。 */
    public attackInterval: number = 0.8;
    /** 攻击范围，超过该距离不选择目标。 */
    public attackRange: number = 1000;
    /** 单发子弹伤害。 */
    public attackDamage: number = 1;
    /** 敌人管理器，用于搜索最近敌人。 */
    public enemyManager: EnemyManager = null;
    /** 已累积的攻击计时器。 */
    private attackTimer: number = 0;


    public Init(index: number) {
        // 更新干员索引，并同步到节点名，便于调试和场景识别。
        this.index = index;
        this.node.name = `Operator${index}`;
    }

    update(dt: number) {
        // 当前干员的主要行为就是自动攻击。
        this.updateAttack(dt);
    }

    private updateAttack(dt: number) {
        // 运行攻击逻辑前，先确认必要依赖已就绪。
        if (!this.enemyManager) {
            // cc.log("没enemyManager");
            return;
        }
        if (!this.bulletPrefab) {
            // cc.log("bulletPrefab");
            return;
        }
        if (!this.bulletRoot) {
            // cc.log("bulletRoot");
            return;
        }

        this.attackTimer += dt;

        // 没到攻击间隔时继续蓄计时，不发射。
        if (this.attackTimer < this.attackInterval) {
            // cc.log("没到时间不发射");
            return;
        }

        // 优先攻击攻击范围内最近的敌人。
        const enemy = this.enemyManager.getNearestManager(cc.v2(this.node.position), this.attackRange);
        if (!enemy) {
            // cc.log("没有敌军不发射");
            return;
        }

        // 找到目标后重置攻击计时，并发射子弹。
        this.attackTimer = 0;
        this.fire(enemy);
    }

    private fire(enemy: EnemyBase) {
        // 实例化子弹，并把它放到统一的子弹容器下。
        const bulletNode = cc.instantiate(this.bulletPrefab);
        bulletNode.parent = this.bulletRoot;
        bulletNode.setPosition(this.node.position);

        // cc.log(this.node.name + "朝" + enemy.node.name + "发射了")
        const bullet = bulletNode.getComponent(TrackingBullet);

        // 统一走子弹基类初始化入口，便于后续切换为其他子弹类型。
        bullet.Init({
            owner: this.node,
            enemyManager: this.enemyManager,
            damage: this.attackDamage,
            target: enemy,
        });
    }


    public setUpBattleRefs(enemyManager: EnemyManager, bulletRoot: cc.Node) {
        // 由小队控制器统一注入战斗依赖，避免每个干员自己查找场景节点。
        this.enemyManager = enemyManager;
        this.bulletRoot = bulletRoot;
    }
}

import ExpOrb from "../ExpOrb";
import EnemyBase from "./EnemyBase";

const { ccclass, property } = cc._decorator;

/**
 * 敌人管理器。
 *
 * 作用：
 * 1. 按固定时间间隔生成敌人；
 * 2. 维护当前场上的敌人列表；
 * 3. 提供“最近敌人”查询给干员射击系统使用；
 * 4. 在敌人死亡时生成经验球，并把拾取结果转发给战斗管理器。
 */
@ccclass
export default class EnemyManager extends cc.Component {

    /** 敌人预制体。 */
    @property(cc.Prefab)
    public enemyPrefab: cc.Prefab = null;
    /** 敌人统一挂载的父节点。 */
    @property(cc.Node)
    public enemyRoot: cc.Node = null;
    /** 敌人追击中心，通常是玩家或队长。 */
    @property(cc.Node)
    public leader: cc.Node = null;

    /** 经验球预制体。 */
    @property(cc.Prefab)
    public expOrbPrefab: cc.Prefab = null;
    /** 掉落物统一挂载节点。 */
    @property(cc.Node)
    public dropRoot: cc.Node = null;

    /** 经验球被拾取后的回调，由 BattleManager 注入。 */
    public onPickExp: (value: number) => void = null;

    /** 敌人生成间隔。 */
    public spawnInterval: number = 3;
    /** 敌人围绕队长的生成半径。 */
    public spawnRadius: number = 500;

    /** 当前场上的敌人列表。 */
    private enemyList: EnemyBase[] = [];

    start() {
        // 启动后按固定时间循环刷怪。
        this.schedule(this.spawnEnemy, this.spawnInterval);
    }

    private spawnEnemy() {
        // 没有追击目标时不生成，避免新敌人一出生就失去行为目标。
        if (!this.leader) return;
        const enemyNode = cc.instantiate(this.enemyPrefab);
        enemyNode.parent = this.enemyRoot;
        enemyNode.setPosition(this.getSpawnPos());

        // 初始化敌人的追击目标和死亡回调，并加入列表管理。
        const enemy = enemyNode.getComponent(EnemyBase);
        enemy.target = this.leader;
        enemy.onDie = this.onEnemyDie.bind(this);
        this.enemyList.push(enemy);

    }

    private getSpawnPos(): cc.Vec2 {
        // 在以 leader 为圆心的圆周上随机取一点作为出生位置。
        const angle = Math.random() * Math.PI * 2;
        const center = this.leader.position;
        return cc.v2(
            center.x + Math.cos(angle) * this.spawnRadius,
            center.y + Math.sin(angle) * this.spawnRadius
        );
    }

    private onEnemyDie(enemy: EnemyBase) {
        // 敌人死亡时先从管理列表里移除，再在原地生成经验球。
        const idx = this.enemyList.indexOf(enemy);
        if (idx !== -1) {
            this.enemyList.splice(idx, 1);
        }
        this.spawnExpOrb(cc.v2(enemy.node.position));
    }

    public getNearestManager(pos: cc.Vec2, range: number = -1): EnemyBase {
        // 在敌人列表中寻找距离给定位置最近的敌人。
        // 如果传入范围，则只在范围内筛选。
        let result: EnemyBase = null;
        let minDisSqr = Number.MAX_VALUE;
        const rangeSqr = range > 0 ? range * range : -1;
        for (let i = this.enemyList.length - 1; i >= 0; i--) {
            const enemy = this.enemyList[i];

            // 顺便清理掉已经失效的敌人引用，保持列表干净。
            if (!enemy || !enemy.node || !enemy.isValid) {
                this.enemyList.splice(i, 1);
                continue;
            }
            const disSqr = enemy.node.position.sub(cc.v3(pos)).magSqr();
            if (rangeSqr > 0 && disSqr > rangeSqr) {
                continue;
            }
            if (disSqr < minDisSqr) {
                minDisSqr = disSqr;
                result = enemy;
            }
        }
        return result;
    }

    public getEnemyList(): EnemyBase[] {
        // 对外暴露当前敌人列表，便于调试或其他系统读取。
        return this.enemyList;
    }

    private spawnExpOrb(pos: cc.Vec2) {
        // 生成经验球，并把拾取事件转发给战斗总控。
        if (!this.leader) return;
        const orbNode = cc.instantiate(this.expOrbPrefab);
        orbNode.parent = this.dropRoot;
        orbNode.setPosition(pos);

        const orb = orbNode.getComponent(ExpOrb);
        orb.target = this.leader;
        orb.onPick = (value: number) => {
            this.onPickExp && this.onPickExp(value);
        }
    }
}

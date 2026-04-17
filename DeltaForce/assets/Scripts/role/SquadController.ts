import EnemyManager from "../enemy/EnemyManager";
import OperatorUnit from "./OperatorUnit";

const { ccclass, property } = cc._decorator;

/**
 * 小队控制器。
 *
 * 作用：
 * 1. 管理所有跟随干员的列表与索引；
 * 2. 记录队长移动轨迹；
 * 3. 让干员沿轨迹按固定间距跟随；
 * 4. 统一给干员注入战斗依赖，并处理增员和全队升级效果。
 *
 * 当前实现的核心思想是：
 * - 队长走过的路径会被离散记录到 `pathPoints`；
 * - 每个干员按“距离队长多少路程”去路径上取样；
 * - 这样比简单跟随前一个人更稳定，也更容易保持队形。
 */
@ccclass
export default class SquadController extends cc.Component {

    /** 队长节点，路径记录和队形跟随都以它为基准。 */
    @property(cc.Node)
    public leader: cc.Node = null;

    /** 小队根节点，所有干员节点都应挂在这里。 */
    @property(cc.Node)
    public squadRoot: cc.Node = null;

    /** 敌人管理器，会分发给每个干员作为攻击目标来源。 */
    @property(EnemyManager)
    public enemyManager: EnemyManager = null;

    /** 子弹挂点，所有干员发射的子弹都放到这里。 */
    @property(cc.Node)
    public bulletRoot: cc.Node = null;

    /** 新增干员时实例化使用的预制体。 */
    @property(cc.Prefab)
    public operatorPrefab: cc.Prefab = null;

    /** 干员之间在路径上的间距。 */
    public spacing: number = 60;
    /** 队长移动超过该距离后，才会新增一个轨迹点。 */
    public minRecordDistance: number = 8;
    /** 路径点上限，用于控制内存和遍历成本。 */
    public maxPathPointCount: number = 2000;

    /** 当前所有干员组件列表，索引越小表示越靠近队长。 */
    private memberList: OperatorUnit[] = [];
    /** 队长的历史轨迹点，数组头部是最新位置。 */
    private pathPoints: cc.Vec2[] = [];

    onLoad() {
        // 启动时先扫描场景中已摆放好的干员。
        this.collectMembers();
    }
    start() {
        // 初始至少记录一个队长位置，避免路径为空。
        this.recordLeaderPos(true);
    }
    update(dt: number) {
        // 每帧先记录队长轨迹，再刷新所有跟随者的位置。
        this.recordLeaderPos(false);
        this.updateMembersFollow();
    }

    private collectMembers() {
        // 重新从场景节点收集干员列表。
        // 这里按 siblingIndex 从后往前遍历，与当前项目的层级表现保持一致。
        this.memberList.length = 0;
        for (let i = this.squadRoot.childrenCount - 1; i >= 0; i--) {
            const node = this.squadRoot.children[i];
            const unit = node.getComponent(OperatorUnit);
            this.memberList.push(unit);
        }
        this.refreshMemberIndex();
    }

    private refreshMemberIndex(): void {
        // 干员顺序变化后，重新设置索引和战斗依赖。
        for (let i = 0; i < this.memberList.length; i++) {
            const unit = this.memberList[i];
            unit.Init(i);
            unit.setUpBattleRefs(this.enemyManager, this.bulletRoot);
        }
    }

    private refreshMembers() {
        // 语义化包装，便于外部调用时更直观看出目的。
        this.collectMembers();
    }

    private recordLeaderPos(force: boolean) {
        // 没有队长时不记录路径。
        if (!this.leader) return;
        const curPos = cc.v2(this.leader.x, this.leader.y);

        // 第一个点直接写入，作为初始路径。
        if (this.pathPoints.length <= 0) {
            this.pathPoints.unshift(curPos);
            return;
        }

        // 强制记录模式常用于初始化或关键状态切换。
        if (force) {
            this.pathPoints.unshift(curPos);
            return;
        }
        const lastPos = this.pathPoints[0];
        const dis = curPos.sub(lastPos).mag();

        // 只有移动足够距离时才记录新点，避免路径点过密。
        if (dis >= this.minRecordDistance) {
            this.pathPoints.unshift(curPos);
        }

        // 控制路径长度上限，避免无限增长。
        if (this.pathPoints.length > this.maxPathPointCount) {
            this.pathPoints.length = this.maxPathPointCount;
        }
    }

    private updateMembersFollow() {
        // 没有干员或没有可用路径时无需更新。
        if (this.memberList.length <= 0 || this.pathPoints.length <= 0) return;

        // 每个干员按“离队长多远”的目标距离去路径上取样。
        for (let i = 0; i < this.memberList.length; i++) {
            const unit = this.memberList[i];
            const targetDistance = (i + 1) * this.spacing;
            const targetPos = this.getPathPosByDistance(targetDistance);

            if (!targetPos) continue;
            unit.node.setPosition(targetPos);
        }
    }

    private getPathPosByDistance(targetDistance: number): cc.Vec2 {
        // 没有路径点时返回空。
        if (this.pathPoints.length <= 0) return null;

        // 只有一个点时，所有人都只能退化到该点。
        if (this.pathPoints.length === 1) {
            return this.pathPoints[0].clone();
        }
        let totalDistance = 0;

        // 从最新路径点往旧路径点累积距离，
        // 找到“目标距离”落在哪一段路径上，再做线性插值。
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];
            const segDistance = p1.sub(p2).mag();
            if (totalDistance + segDistance >= targetDistance) {
                const remain = targetDistance - totalDistance;
                const dir = p2.sub(p1).normalize();
                return p1.add(dir.mul(remain));
            }
            totalDistance += segDistance;
        }

        // 路径不够长时，返回最旧的路径点，让干员停在路径尾端。
        return this.pathPoints[this.pathPoints.length - 1].clone();
    }

    public addMember(node: cc.Node) {
        // 把一个已有节点加入小队，并挂到小队根节点下。
        if (!node || !this.squadRoot) return;
        node.parent = this.squadRoot;

        // 放到层级最底部，配合当前从后往前的队员组织方式。
        node.setSiblingIndex(0);
        let unit = node.getComponent(OperatorUnit);
        if (!unit) {
            unit = node.addComponent(OperatorUnit);
        }

        // 新成员初始位置落在路径末端附近，再重新整理全队列表。
        node.setPosition(this.getNewMemberInitPos());

        this.collectMembers();
    }

    private getNewMemberInitPos(): cc.Vec2 {
        // 新成员默认站在当前队尾应在的位置。
        const targetDistance = (this.memberList.length + 1) * this.spacing;
        const pos = this.getPathPosByDistance(targetDistance);
        if (pos) {
            return pos;
        }
        if (this.leader) {
            return cc.v2(this.leader.position.clone());
        }
        return cc.v2();
    }

    public getMemberList(): OperatorUnit[] {
        // 对外暴露当前干员列表，便于其他系统读取队伍状态。
        return this.memberList;
    }

    public addEmptyMember() {
        // 通过预制体实例化一个默认干员并加入小队。
        const node = cc.instantiate(this.operatorPrefab);
        this.addMember(node);
    }
    public addAllMemberAttack(value: number) {
        // 全队统一增加攻击力。
        for (let i = 0; i < this.memberList.length; i++) {
            this.memberList[i].attackDamage += value;
        }
    }
    public addAllMemberFireRate(value: number) {
        // 全队统一降低攻击间隔，从而提高射速。
        // 用最小值保护，避免间隔减到 0 或负数。
        for (let i = 0; i < this.memberList.length; i++) {
            const unit = this.memberList[i];
            unit.attackInterval = Math.max(0.1, unit.attackInterval - value);
        }
    }
}

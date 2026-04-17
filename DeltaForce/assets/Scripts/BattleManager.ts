import { UpgradeOption, UpgradeType } from "./BattleDefine";
import EnemyManager from "./enemy/EnemyManager";
import LevelUpPanel from "./ui/LevelUpPanel";
import SquadController from "./role/SquadController";
import RoleHealth from "./role/RoleHealth";
import ResultPanel from "./ui/ResultPanel";

const { ccclass, property } = cc._decorator;

/**
 * 战斗主流程管理器。
 *
 * 作用：
 * 1. 连接敌人、队伍、角色血量、升级面板和结算面板等核心系统；
 * 2. 维护局内等级、经验和升级所需经验；
 * 3. 处理经验增长、升级选项生成与升级结果应用；
 * 4. 监听主角生命变化，并在死亡时触发失败结算。
 *
 * 这个脚本相当于当前 demo 的“局内状态中枢”，
 * 负责把各个相对独立的系统串起来。
 */
@ccclass
export default class BattleManager extends cc.Component {

    /** 敌人管理器，用于接收经验拾取事件。 */
    @property(EnemyManager)
    public enemyManager: EnemyManager = null;
    /** 小队控制器，用于应用升级效果。 */
    @property(SquadController)
    public squadController: SquadController = null;
    /** 升级选择面板。 */
    @property(LevelUpPanel)
    public levelUpPanel: LevelUpPanel = null;
    /** 等级文本。 */
    @property(cc.Label)
    public levelLabel: cc.Label = null;
    /** 经验文本。 */
    @property(cc.Label)
    public expLabel: cc.Label = null;
    /** 经验进度条。当前类型写成了 Label，但本意是进度 UI 引用。 */
    @property(cc.ProgressBar)
    public expProgress: cc.Label = null;
    /** 主角生命组件。 */
    @property(RoleHealth)
    public roleHealth: RoleHealth = null;
    /** 战斗结果面板。 */
    @property(ResultPanel)
    public resultPanel: ResultPanel = null;
    /** 血量文本。 */
    @property(cc.Label)
    public hpLabel: cc.Label = null;

    /** 当前等级。 */
    public curLevel: number = 1;
    /** 当前已拥有经验。 */
    public curExp: number = 0;
    /** 升到下一等级所需经验。 */
    public needExp: number = 5;

    /** 是否处于升级选择中，用来阻止重复弹出升级逻辑。 */
    private isLeveling: boolean = false;

    start() {
        // 敌人管理器负责掉落经验球，经验球被拾取后会回调到这里加经验。
        if (this.enemyManager) {
            this.enemyManager.onPickExp = this.addExp.bind(this);
        }

        // 监听主角血量变化和死亡事件，统一更新 UI 与失败结算。
        if (this.roleHealth) {
            this.roleHealth.onHpChange = this.onRoleHpChange.bind(this);
            this.roleHealth.onDie = this.onRoleDie.bind(this);
        }
        this.refreshUI();
    }

    public addExp(value: number) {
        // 升级面板打开时暂时不继续累计，避免同一帧连跳多次升级。
        if (this.isLeveling) return;
        this.curExp += value;

        // 当前版本每次只处理一次升级：
        // 即便获得大量经验，也会在弹出一次升级后暂停，等玩家做完选择再继续。
        while (this.curExp >= this.needExp) {
            this.curExp -= this.needExp;
            this.levelUp();
            break;
        }
        this.refreshUI();
    }

    public levelUp() {
        // 等级提升，并简单提高下一等级所需经验。
        this.curLevel++;
        this.needExp += 3;
        this.isLeveling = true;

        // 这里原本预留了暂停逻辑，当前是否真正暂停由外部决定。
        // cc.director.pause();
        const options = this.getUpgradeOptions();
        this.levelUpPanel.show(options, this.onSelectUpgrade.bind(this));

        this.refreshUI();
    }

    private getUpgradeOptions(): UpgradeOption[] {
        // 当前版本使用固定的三选一升级池。
        // 后续如果要做随机升级，这里就是主要扩展点。
        return [
            {
                type: UpgradeType.AddMember,
                title: "新增干员",
                desc: "小队新增一名干员",
            },
            {
                type: UpgradeType.AddAtk,
                title: "攻击力提升",
                desc: "所有干员攻击力+1",
            },
            {
                type: UpgradeType.AddFireRate,
                title: "射速提升",
                desc: "所有干员攻击间隔减少",
            },

        ];
    }

    private onSelectUpgrade(option: UpgradeOption) {
        // 根据玩家选中的升级类型，把效果分发给对应系统处理。
        switch (option.type) {
            case UpgradeType.AddMember:
                this.squadController.addEmptyMember();
                break;
            case UpgradeType.AddAtk:
                this.squadController.addAllMemberAttack(1);
                break;
            case UpgradeType.AddFireRate:
                this.squadController.addAllMemberFireRate(0.1);
                break;
        }

        // 升级流程结束，恢复正常战斗状态。
        this.isLeveling = false;
        cc.director.resume();
        this.refreshUI();
    }

    private refreshUI() {
        // 刷新所有基础战斗 UI。
        // 这里默认相关引用都已在编辑器中正确绑定。
        this.levelLabel.string = `Lv.${this.curLevel}`;
        this.expLabel.string = `${this.curExp}/${this.needExp}`;
        this.hpLabel.string = `HP:${this.roleHealth.curHp}/${this.roleHealth.maxHp}`;
    }

    private onRoleHpChange(curHp: number, maxHp: number) {
        // 血量变化时单独刷新生命显示，避免等到全量 UI 更新。
        if (this.hpLabel) {
            this.hpLabel.string = `HP:${curHp}/${maxHp}`;
        }
    }

    private onRoleDie() {
        // 主角死亡时直接进入失败结算。
        this.onBattleFail();
    }

    private onBattleFail() {
        // 显示失败结果面板。
        if (this.resultPanel) {
            this.resultPanel.showFail();
        }
    }
}

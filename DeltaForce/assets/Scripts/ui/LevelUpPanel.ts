import { UpgradeOption } from "../BattleDefine";

const { ccclass, property } = cc._decorator;

/**
 * 升级选择面板。
 *
 * 作用：
 * 1. 接收升级选项数据并刷新按钮显示；
 * 2. 在玩家点击选项时把结果回调给战斗管理器；
 * 3. 控制升级 UI 的显示与隐藏。
 *
 * 当前默认按钮数量与传入选项数量一一对应，
 * 外部应保证 `btnList`、`titleList`、`descList` 的配置一致。
 */
@ccclass
export default class LevelUpPanel extends cc.Component {

    /** 升级按钮列表。 */
    @property(cc.Button)
    public btnList: cc.Button[] = [];

    /** 每个选项对应的标题文本。 */
    @property(cc.Label)
    public titleList: cc.Label[] = [];
    /** 每个选项对应的描述文本。 */
    @property(cc.Label)
    public descList: cc.Label[] = [];

    /** 当前面板正在展示的升级选项数据。 */
    private options: UpgradeOption[] = [];
    /** 玩家选中某个选项后的回调。 */
    private selectCb: (option: UpgradeOption) => void = null;

    onLoad() {
        // 初始隐藏，只有升级时才弹出。
        this.node.active = false;
    }

    public show(options: UpgradeOption[], cb: (option: UpgradeOption) => void) {
        // 打开面板，并缓存本次升级的选项与确认回调。
        this.node.active = true;
        this.options = options;
        this.selectCb = cb;

        // 刷新每个槽位的标题和描述文本。
        for (let i = 0; i < this.descList.length; i++) {
            const option = options[i];
            this.titleList[i].string = `${option.title}`;
            this.descList[i].string = `${option.desc}`;
        }
    }

    public hide() {
        // 隐藏升级面板，等待下一次升级时重新打开。
        this.node.active = false;

    }

    public onClickOption(event: cc.Event, customData: string) {
        // customData 由按钮配置传入，用来标识点中的是第几个选项。
        const index = Number(customData);
        const option = this.options[index];
        if (!option) return;

        // 先隐藏 UI，再把选择结果通知外部。
        this.hide();
        this.selectCb && this.selectCb(option);
    }
}
